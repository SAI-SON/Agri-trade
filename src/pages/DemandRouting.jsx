import React, { useState, useMemo } from 'react';
import { MapPin, Zap, IndianRupee, Truck, TrendingUp } from 'lucide-react';
import { MARKETS, CROPS, FARMER_LOCATIONS, getCropPrice, calculateTransportCost, computeOptimalRoute } from '../lib/data.js';
import { suggestBestMarket } from '../lib/gemini.js';
import toast from 'react-hot-toast';
import './DemandRouting.css';

export default function DemandRouting() {
  const [selectedCrop, setSelectedCrop] = useState(CROPS[0]);
  const [fromLocation, setFromLocation] = useState(FARMER_LOCATIONS[0]);
  const [quantity, setQuantity] = useState(100);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const routeData = useMemo(() => {
    const ordered = computeOptimalRoute(fromLocation, MARKETS);
    return ordered.map(market => {
      const price = getCropPrice(selectedCrop, market);
      const transportCost = calculateTransportCost(market.distance, market);
      const grossRevenue = price * quantity;
      const netProfit = grossRevenue - transportCost;
      const profitPerKg = Math.round(netProfit / quantity);
      return { ...market, price, transportCost, grossRevenue, netProfit, profitPerKg };
    });
  }, [selectedCrop, fromLocation, quantity]);

  const bestMarket = routeData.reduce((best, m) => m.netProfit > best.netProfit ? m : best, routeData[0]);

  async function getAISuggestion() {
    setLoadingAI(true);
    try {
      const marketsForAI = routeData.map(m => ({
        name: m.name, city: m.city, price: m.price, demand: m.demand,
      }));
      const raw = await suggestBestMarket(selectedCrop.name, fromLocation.name, marketsForAI);
      // Try to parse JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAiSuggestion(parsed);
        if (parsed.source === 'local-fallback') {
          toast('Gemini API blocked. Showing local routing estimate.', { icon: '⚠️' });
        }
      } else {
        setAiSuggestion({ bestMarket: 'See below', reason: raw, estimatedProfit: 'AI analysis', tip: '' });
      }
    } catch (error) {
      toast.error(error?.message || 'AI suggestion failed. Try again.');
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div className="page-container fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-heading">📍 Smart Demand-Based Crop Routing</h1>
        <p className="section-sub">Find the most profitable market for your crop</p>
      </div>

      {/* Controls */}
      <div className="routing-controls glass-card">
        <div className="form-row">
          <div className="form-group">
            <label className="input-label">Your Location</label>
            <select
              className="input-field"
              value={fromLocation.id}
              onChange={e => setFromLocation(FARMER_LOCATIONS.find(l => l.id === e.target.value))}
            >
              {FARMER_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="input-label">Crop</label>
            <select
              className="input-field"
              value={selectedCrop.id}
              onChange={e => setSelectedCrop(CROPS.find(c => c.id === e.target.value))}
            >
              {CROPS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="input-label">Quantity (kg)</label>
            <input
              type="number" className="input-field" min={1}
              value={quantity} onChange={e => setQuantity(Number(e.target.value))}
            />
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <label className="input-label">&nbsp;</label>
            <button
              className="btn btn-primary"
              onClick={getAISuggestion}
              disabled={loadingAI}
            >
              {loadingAI ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing...</> : <><Zap size={16} /> AI Suggest</>}
            </button>
          </div>
        </div>
      </div>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="ai-suggestion-card glass-card fade-in">
          <div className="ai-badge"><Zap size={14} /> Gemini AI Recommendation</div>
          <h3 className="ai-market-name">🏆 {aiSuggestion.bestMarket}</h3>
          <p className="ai-reason">{aiSuggestion.reason}</p>
          <div className="ai-meta">
            <span><IndianRupee size={13} /> {aiSuggestion.estimatedProfit}</span>
            {aiSuggestion.tip && <span>💡 {aiSuggestion.tip}</span>}
          </div>
        </div>
      )}

      {/* Best Market Highlight */}
      {bestMarket && (
        <div className="best-market-card glass-card fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="best-badge">🏆 BEST MARKET</div>
            <span className="best-market-name">{bestMarket.name}, {bestMarket.city}</span>
          </div>
          <div className="best-stats">
            <div className="best-stat">
              <span>Price</span>
              <strong>₹{bestMarket.price}/{selectedCrop.unit}</strong>
            </div>
            <div className="best-stat">
              <span>Demand</span>
              <strong className={bestMarket.demand === 'High' ? 'text-green' : 'text-amber'}>{bestMarket.demand}</strong>
            </div>
            <div className="best-stat">
              <span>Distance</span>
              <strong>{bestMarket.distance} km</strong>
            </div>
            <div className="best-stat">
              <span>Transport</span>
              <strong>₹{bestMarket.transportCost}</strong>
            </div>
            <div className="best-stat highlight">
              <span>Net Profit</span>
              <strong>₹{bestMarket.netProfit.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      )}

      {/* All Routes */}
      <div style={{ marginTop: 24 }}>
        <h2 className="section-heading" style={{ fontSize: 18 }}>All Market Routes</h2>
        <div className="routes-list" style={{ marginTop: 12 }}>
          {routeData.map((market, idx) => (
            <div
              key={market.id}
              className={`route-card glass-card ${market.id === bestMarket?.id ? 'route-best' : ''}`}
            >
              <div className="route-rank">{idx + 1}</div>
              <div className="route-info">
                <div className="route-header">
                  <span className="route-market-name">{market.name}</span>
                  <span className="route-city">{market.city}</span>
                  <span className={`badge ${market.demand === 'High' ? 'badge-success' : market.demand === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>
                    {market.demand}
                  </span>
                  {market.id === bestMarket?.id && <span className="badge badge-success">⭐ Best</span>}
                </div>
                <div className="route-details">
                  <span><MapPin size={12} /> {market.distance} km</span>
                  <span><IndianRupee size={12} /> ₹{market.price}/kg</span>
                  <span><Truck size={12} /> ₹{market.transportCost} transport</span>
                  <span><TrendingUp size={12} /> ₹{market.profitPerKg}/kg net</span>
                </div>
              </div>
              <div className="route-profit">
                <span className="profit-label">Net Profit</span>
                <span className={`profit-value ${market.netProfit > 0 ? 'positive' : 'negative'}`}>
                  ₹{market.netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
