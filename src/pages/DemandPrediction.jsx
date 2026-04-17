import React, { useState } from 'react';
import { CROPS, MARKETS } from '../lib/data.js';
import { predictDemand } from '../lib/gemini.js';
import { TrendingUp, Zap, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import './DemandPrediction.css';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const SAMPLE_DATA = [
  { crop: 'Tomato', month: 'April', region: 'Tamil Nadu', demandLevel: 'High', priceRange: '₹25-35/kg', reason: 'Summer heat increases demand for cooling vegetables and beverages. Restaurant demand peaks.', strategy: 'Sell in bulk to Chennai Koyambedu market early morning for best price.' },
  { crop: 'Onion', month: 'April', region: 'Tamil Nadu', demandLevel: 'Medium', priceRange: '₹28-40/kg', reason: 'Wedding season drives household demand. Stock from Maharashtra reduces slightly.', strategy: 'Store for 2 more weeks, prices expected to rise by 15% next month.' },
  { crop: 'Mango', month: 'April', region: 'Tamil Nadu', demandLevel: 'High', priceRange: '₹55-80/kg', reason: 'Peak mango season! Export demand from Middle East and Europe at maximum.', strategy: 'Direct export or sell to Koyambedu wholesale for maximum profit.' },
];

export default function DemandPrediction() {
  const [selectedCrop, setSelectedCrop] = useState(CROPS[0]);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedRegion, setSelectedRegion] = useState('Tamil Nadu');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(SAMPLE_DATA);

  async function predict() {
    setLoading(true);
    try {
      const raw = await predictDemand(selectedCrop.name, selectedMonth, selectedRegion);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      let result;
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { demandLevel: 'Medium', priceRange: 'See analysis', reason: raw, strategy: 'Consult local market' };
      }
      result.crop = selectedCrop.name;
      result.month = selectedMonth;
      result.region = selectedRegion;
      setPrediction(result);
      setHistory(p => [result, ...p.slice(0, 4)]);
      toast.success('AI prediction complete!');
    } catch {
      toast.error('Prediction failed. Check API.');
    } finally {
      setLoading(false);
    }
  }

  const demandColor = { High: '#22c55e', Medium: '#f59e0b', Low: '#f87171' };

  return (
    <div className="page-container fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-heading">📊 AI Demand Prediction & Crop Suggestion</h1>
        <p className="section-sub">Know what to grow before you plant — powered by Gemini AI</p>
      </div>

      {/* Prediction Form */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div className="predict-form">
          <div className="form-group">
            <label className="input-label">Crop</label>
            <select className="input-field" value={selectedCrop.id}
              onChange={e => setSelectedCrop(CROPS.find(c => c.id === e.target.value))}>
              {CROPS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="input-label">Month</label>
            <select className="input-field" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="input-label">Region</label>
            <select className="input-field" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}>
              <option>Tamil Nadu</option><option>Karnataka</option>
              <option>Andhra Pradesh</option><option>Kerala</option><option>Maharashtra</option>
            </select>
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <label className="input-label">&nbsp;</label>
            <button className="btn btn-primary" onClick={predict} disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Predicting...</> : <><Zap size={16} /> Predict Demand</>}
            </button>
          </div>
        </div>
      </div>

      {/* Live Prediction */}
      {prediction && (
        <div className="prediction-result glass-card fade-in" style={{ borderColor: demandColor[prediction.demandLevel] + '55' }}>
          <div className="pred-header">
            <div className="pred-crop">
              <span style={{ fontSize: 32 }}>{selectedCrop.emoji}</span>
              <div>
                <h3 className="pred-name">{prediction.crop}</h3>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{prediction.month} · {prediction.region}</span>
              </div>
            </div>
            <div className="pred-demand" style={{ borderColor: demandColor[prediction.demandLevel] + '55', background: demandColor[prediction.demandLevel] + '15' }}>
              <div className="pred-demand-dot" style={{ background: demandColor[prediction.demandLevel] }} />
              <span style={{ color: demandColor[prediction.demandLevel], fontWeight: 800, fontSize: 18 }}>
                {prediction.demandLevel} Demand
              </span>
            </div>
          </div>
          <div className="pred-grid">
            <div className="pred-item">
              <span>Expected Price</span>
              <strong>{prediction.priceRange}</strong>
            </div>
            <div className="pred-item" style={{ gridColumn: '2 / -1' }}>
              <span>Why this demand?</span>
              <strong>{prediction.reason}</strong>
            </div>
            <div className="pred-item" style={{ gridColumn: '1 / -1', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <span>💡 Strategy Recommendation</span>
              <strong>{prediction.strategy}</strong>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div style={{ marginTop: 28 }}>
        <h2 className="section-heading" style={{ fontSize: 17, marginBottom: 12 }}>Recent Predictions</h2>
        <div className="history-grid">
          {history.map((h, i) => (
            <div key={i} className="history-card glass-card">
              <div className="history-header">
                <span style={{ fontSize: 20 }}>{CROPS.find(c => c.name.includes(h.crop?.split(' ')[0]))?.emoji || '🌱'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{h.crop}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{h.month} · {h.region}</div>
                </div>
                <span style={{ color: demandColor[h.demandLevel], fontWeight: 700, fontSize: 13 }}>
                  {h.demandLevel}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', opacity: 0.8, lineHeight: 1.5, marginTop: 8 }}>{h.reason}</p>
              <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(34,197,94,0.06)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 700, color: 'var(--green-400)' }}>
                {h.priceRange}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
