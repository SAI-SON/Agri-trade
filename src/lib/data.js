// Tamil Nadu markets with coordinates
export const MARKETS = [
  { id: 'chennai', name: 'Koyambedu Market', city: 'Chennai', lat: 13.0695, lng: 80.1963, demand: 'High', transportCostPerKm: 2.5 },
  { id: 'coimbatore', name: 'Ukkadam Market', city: 'Coimbatore', lat: 11.0038, lng: 76.9629, demand: 'High', transportCostPerKm: 2.2 },
  { id: 'madurai', name: 'Mattuthavani Market', city: 'Madurai', lat: 9.9195, lng: 78.1193, demand: 'Medium', transportCostPerKm: 2.0 },
  { id: 'salem', name: 'Salem Market', city: 'Salem', lat: 11.6643, lng: 78.1460, demand: 'Medium', transportCostPerKm: 1.8 },
  { id: 'trichy', name: 'Ariyamangalam Market', city: 'Trichy', lat: 10.7905, lng: 78.7047, demand: 'Medium', transportCostPerKm: 1.9 },
  { id: 'erode', name: 'Erode Market', city: 'Erode', lat: 11.3410, lng: 77.7172, demand: 'High', transportCostPerKm: 1.7 },
  { id: 'tirunelveli', name: 'Tirunelveli Market', city: 'Tirunelveli', lat: 8.7139, lng: 77.7567, demand: 'Low', transportCostPerKm: 1.6 },
  { id: 'vellore', name: 'Vellore Market', city: 'Vellore', lat: 12.9165, lng: 79.1325, demand: 'Medium', transportCostPerKm: 2.1 },
];

export const CROPS = [
  { id: 'tomato', name: 'Tomato / தக்காளி', emoji: '🍅', basePrice: 25, unit: 'kg' },
  { id: 'onion', name: 'Onion / வெங்காயம்', emoji: '🧅', basePrice: 30, unit: 'kg' },
  { id: 'potato', name: 'Potato / உருளைக்கிழங்கு', emoji: '🥔', basePrice: 20, unit: 'kg' },
  { id: 'rice', name: 'Rice / அரிசி', emoji: '🌾', basePrice: 45, unit: 'kg' },
  { id: 'sugarcane', name: 'Sugarcane / கரும்பு', emoji: '🎋', basePrice: 5, unit: 'kg' },
  { id: 'banana', name: 'Banana / வாழைப்பழம்', emoji: '🍌', basePrice: 35, unit: 'doz' },
  { id: 'mango', name: 'Mango / மாம்பழம்', emoji: '🥭', basePrice: 60, unit: 'kg' },
  { id: 'coconut', name: 'Coconut / தேங்காய்', emoji: '🥥', basePrice: 18, unit: 'pc' },
  { id: 'chilli', name: 'Chilli / மிளகாய்', emoji: '🌶️', basePrice: 80, unit: 'kg' },
  { id: 'groundnut', name: 'Groundnut / வேர்கடலை', emoji: '🥜', basePrice: 55, unit: 'kg' },
];

export const FARMER_LOCATIONS = [
  { id: 'thiruvallur', name: 'Thiruvallur', lat: 13.1428, lng: 79.9078 },
  { id: 'dharmapuri', name: 'Dharmapuri', lat: 12.1276, lng: 78.1578 },
  { id: 'namakkal', name: 'Namakkal', lat: 11.2180, lng: 78.1672 },
  { id: 'tiruvannamalai', name: 'Tiruvannamalai', lat: 12.2253, lng: 79.0747 },
  { id: 'villupuram', name: 'Villupuram', lat: 11.9401, lng: 79.4861 },
  { id: 'krishnagiri', name: 'Krishnagiri', lat: 12.5266, lng: 78.2141 },
  { id: 'theni', name: 'Theni', lat: 10.0104, lng: 77.4772 },
  { id: 'dindigul', name: 'Dindigul', lat: 10.3624, lng: 77.9695 },
];

export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getCropPrice(crop, market) {
  const demandMultiplier = { High: 1.3, Medium: 1.0, Low: 0.75 };
  const variance = 0.9 + Math.random() * 0.2;
  return Math.round(crop.basePrice * demandMultiplier[market.demand] * variance);
}

export function calculateTransportCost(distance, market) {
  return Math.round(distance * market.transportCostPerKm);
}

export function computeOptimalRoute(fromLocation, markets) {
  return markets
    .map(market => {
      const dist = getDistance(fromLocation.lat, fromLocation.lng, market.lat, market.lng);
      return { ...market, distance: Math.round(dist) };
    })
    .sort((a, b) => a.distance - b.distance);
}

export function groupFarmersForSharedTransport(farmers) {
  // Simple greedy grouping by proximity
  const groups = [];
  const used = new Set();
  farmers.forEach((f, i) => {
    if (used.has(i)) return;
    const group = [f];
    used.add(i);
    farmers.forEach((g, j) => {
      if (!used.has(j) && group.length < 4) {
        const dist = getDistance(f.lat, f.lng, g.lat, g.lng);
        if (dist < 30) { group.push(g); used.add(j); }
      }
    });
    groups.push(group);
  });
  return groups;
}
