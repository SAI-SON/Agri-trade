const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL;

const MODEL_CANDIDATES = [
  GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-1.5-flash',
].filter(Boolean);

const CROP_BASE_PRICE = {
  tomato: 25,
  onion: 30,
  potato: 20,
  rice: 45,
  sugarcane: 5,
  banana: 35,
  mango: 60,
  coconut: 18,
  chilli: 80,
  groundnut: 55,
};

const PEAK_MONTHS_BY_CROP = {
  tomato: ['January', 'February', 'March', 'April'],
  onion: ['April', 'May', 'June'],
  potato: ['November', 'December', 'January'],
  rice: ['September', 'October', 'November'],
  sugarcane: ['December', 'January', 'February'],
  banana: ['August', 'September', 'October'],
  mango: ['April', 'May', 'June'],
  coconut: ['March', 'April', 'May'],
  chilli: ['January', 'February', 'March'],
  groundnut: ['October', 'November', 'December'],
};

function normalizeCropKey(cropName) {
  const left = (cropName || '').split('/')[0].trim().toLowerCase();
  const known = Object.keys(CROP_BASE_PRICE).find(key => left.includes(key));
  return known || 'tomato';
}

function regionDemandBoost(region) {
  const highDemandRegions = ['tamil nadu', 'maharashtra', 'karnataka'];
  return highDemandRegions.includes((region || '').toLowerCase()) ? 1.08 : 1;
}

function buildLocalDemandPrediction(cropName, month, region) {
  const cropKey = normalizeCropKey(cropName);
  const basePrice = CROP_BASE_PRICE[cropKey] || 25;
  const isPeakMonth = (PEAK_MONTHS_BY_CROP[cropKey] || []).includes(month);
  const seasonalMultiplier = isPeakMonth ? 1.18 : 0.95;
  const regionMultiplier = regionDemandBoost(region);
  const estimatedPrice = Math.round(basePrice * seasonalMultiplier * regionMultiplier);

  let demandLevel = 'Medium';
  if (estimatedPrice >= Math.round(basePrice * 1.12)) demandLevel = 'High';
  if (estimatedPrice <= Math.round(basePrice * 0.9)) demandLevel = 'Low';

  const min = Math.max(1, Math.round(estimatedPrice * 0.9));
  const max = Math.max(min + 2, Math.round(estimatedPrice * 1.15));

  return {
    demandLevel,
    priceRange: `₹${min}-${max}/kg`,
    reason: `Local estimate based on ${cropName} seasonal trend in ${month} and demand pattern for ${region}.`,
    strategy: demandLevel === 'High'
      ? 'Prioritize early morning wholesale sale and stagger deliveries over 2-3 days for better rates.'
      : demandLevel === 'Low'
        ? 'Hold inventory briefly where feasible and explore nearby high-turnover markets before bulk sale.'
        : 'Split quantity between wholesale and direct buyers to reduce price risk.',
    source: 'local-fallback',
  };
}

function demandWeight(demand) {
  if (demand === 'High') return 1.15;
  if (demand === 'Low') return 0.9;
  return 1;
}

function parsePriceValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildLocalMarketSuggestion(crop, farmerLocation, markets) {
  const ranked = (markets || []).map(m => {
    const price = parsePriceValue(m.price);
    const adjusted = Math.round(price * demandWeight(m.demand));
    return {
      ...m,
      adjustedScore: adjusted,
      estimatedProfit: `Approx. INR ${adjusted * 100} per 100 kg`,
    };
  }).sort((a, b) => b.adjustedScore - a.adjustedScore);

  const best = ranked[0];
  if (!best) {
    return {
      bestMarket: 'No market data available',
      reason: 'Could not compute recommendation because markets list is empty.',
      estimatedProfit: 'N/A',
      tip: 'Try again after loading market data.',
      source: 'local-fallback',
    };
  }

  return {
    bestMarket: `${best.name} (${best.city})`,
    reason: `Estimated best option for ${crop} from ${farmerLocation} using price-demand scoring from current market data.`,
    estimatedProfit: best.estimatedProfit,
    tip: 'Ship early morning and verify same-day wholesale rates before dispatch.',
    source: 'local-fallback',
  };
}

function isBlockedGeminiError(error) {
  const text = String(error?.message || '').toLowerCase();
  return Boolean(
    error?.status === 403
    || text.includes('are blocked')
    || text.includes('permission denied')
    || text.includes('access is denied')
  );
}

function buildGeminiUrl(model, apiKey) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

function shouldTryNextModel(status) {
  return status === 404 || status === 429;
}

async function parseErrorMessage(response) {
  try {
    const body = await response.json();
    return body?.error?.message || `Gemini API error: ${response.status}`;
  } catch {
    return `Gemini API error: ${response.status}`;
  }
}

export async function askGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing VITE_GEMINI_API_KEY. Add it to your .env file and restart Vite.');
  }

  let lastError = null;

  for (const model of MODEL_CANDIDATES) {
    try {
      const response = await fetch(buildGeminiUrl(model, GEMINI_API_KEY), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      });

      if (!response.ok) {
        const message = await parseErrorMessage(response);
        const status = response.status;
        const error = new Error(message);
        error.status = status;
        error.model = model;
        lastError = error;

        if (shouldTryNextModel(status)) continue;
        throw error;
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response available.';
    } catch (err) {
      if (err?.status) {
        if (shouldTryNextModel(err.status)) continue;
        console.error('Gemini API error:', err);
        throw err;
      }

      lastError = err;
    }
  }

  console.error('Gemini error:', lastError);
  throw lastError || new Error('Unable to reach Gemini API.');
}


export async function generateProductDescription(cropName, quantity, quality, location) {
  const prompt = `You are an agricultural marketplace assistant. Generate a compelling and trustworthy product listing description for:
- Crop: ${cropName}
- Quantity: ${quantity} kg
- Quality: ${quality}
- Location: ${location}

Write 2-3 sentences that highlight freshness, quality, and farmer reliability. Keep it simple and clear for buyers.`;
  return askGemini(prompt);
}

export async function predictDemand(cropName, month, region) {
  const prompt = `As an agricultural market analyst, predict the demand for ${cropName} in ${region} during ${month}.
Provide:
1. Demand level (High/Medium/Low)
2. Expected price range (in INR per kg)
3. Key reason for this demand
4. Best selling strategy
Format response as JSON with keys: demandLevel, priceRange, reason, strategy`;

  try {
    return await askGemini(prompt);
  } catch (error) {
    if (isBlockedGeminiError(error)) {
      const fallback = buildLocalDemandPrediction(cropName, month, region);
      return JSON.stringify(fallback);
    }
    throw error;
  }
}

export async function suggestBestMarket(crop, farmerLocation, markets) {
  const marketList = markets.map(m => `${m.name} (${m.city}) - current price: ₹${m.price}/kg, demand: ${m.demand}`).join('\n');
  const prompt = `A farmer in ${farmerLocation} wants to sell ${crop}. 
Available markets:
${marketList}

Recommend the best market considering price, demand, and typical transport feasibility. 
Reply in simple English/Tamil. Format: JSON with keys: bestMarket, reason, estimatedProfit, tip`;

  try {
    return await askGemini(prompt);
  } catch (error) {
    if (isBlockedGeminiError(error)) {
      const fallback = buildLocalMarketSuggestion(crop, farmerLocation, markets);
      return JSON.stringify(fallback);
    }
    throw error;
  }
}

export async function analyzeTrustScore(reviews) {
  const reviewText = reviews.map(r => `Rating: ${r.rating}/5 - "${r.comment}"`).join('\n');
  const prompt = `Analyze these farmer reviews for authenticity and trust indicators:
${reviewText}

Provide JSON with keys: trustScore (0-100), genuineReviews, suspiciousPatterns, recommendation`;
  return askGemini(prompt);
}
