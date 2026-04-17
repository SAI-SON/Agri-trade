const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using gemini-2.5-flash for better rate limits (as requested)
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function askGemini(prompt) {
  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });
    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response available.';
  } catch (err) {
    console.error('Gemini error:', err);
    throw err;
  }
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
  return askGemini(prompt);
}

export async function suggestBestMarket(crop, farmerLocation, markets) {
  const marketList = markets.map(m => `${m.name} (${m.city}) - current price: ₹${m.price}/kg, demand: ${m.demand}`).join('\n');
  const prompt = `A farmer in ${farmerLocation} wants to sell ${crop}. 
Available markets:
${marketList}

Recommend the best market considering price, demand, and typical transport feasibility. 
Reply in simple English/Tamil. Format: JSON with keys: bestMarket, reason, estimatedProfit, tip`;
  return askGemini(prompt);
}

export async function analyzeTrustScore(reviews) {
  const reviewText = reviews.map(r => `Rating: ${r.rating}/5 - "${r.comment}"`).join('\n');
  const prompt = `Analyze these farmer reviews for authenticity and trust indicators:
${reviewText}

Provide JSON with keys: trustScore (0-100), genuineReviews, suspiciousPatterns, recommendation`;
  return askGemini(prompt);
}
