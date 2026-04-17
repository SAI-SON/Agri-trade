import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShoppingBag, Truck, TrendingUp, Star, MessageCircle, ArrowRight, Sprout, IndianRupee } from 'lucide-react';
import { MARKETS, CROPS, getCropPrice, FARMER_LOCATIONS } from '../lib/data.js';
import { useAuth } from '../context/useAuth.jsx';
import './Dashboard.css';

export default function Dashboard() {
  const { profile } = useAuth();

  const marketPrices = useMemo(() => {
    const rice = CROPS.find(c => c.id === 'rice');
    const tomato = CROPS.find(c => c.id === 'tomato');
    return MARKETS.slice(0, 6).map(m => ({
      ...m,
      ricePrice: getCropPrice(rice, m),
      tomatoPrice: getCropPrice(tomato, m),
    }));
  }, []);

  const MODULES = [
    {
      to: '/demand-routing', icon: MapPin, label: 'Demand Routing',
      desc: 'Find the best market with optimal path & profit analysis',
      gradient: 'linear-gradient(135deg, #22c55e, #059669)', tag: 'AI-Powered',
    },
    {
      to: '/marketplace', icon: ShoppingBag, label: 'Marketplace',
      desc: 'Direct farmer-to-buyer platform with trust verification',
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', tag: 'Direct Trade',
    },
    {
      to: '/shared-transport', icon: Truck, label: 'Shared Transport',
      desc: 'Group nearby farmers, share trucks, cut transport costs',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', tag: '3x Savings',
    },
    {
      to: '/demand-prediction', icon: TrendingUp, label: 'AI Prediction',
      desc: 'Predict crop demand using AI before you even plant',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', tag: 'Gemini AI',
    },
    {
      to: '/trust-score', icon: Star, label: 'Trust Score',
      desc: 'Verified profiles, real reviews, trusted trading',
      gradient: 'linear-gradient(135deg, #ec4899, #db2777)', tag: 'Verified',
    },
    {
      to: '/chat', icon: MessageCircle, label: 'Live Chat',
      desc: 'Real-time messaging between farmers and buyers',
      gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)', tag: 'Real-time',
    },
  ];

  return (
    <div className="page-container fade-in">
      {/* Hero */}
      <div className="dashboard-hero glass-card">
        <div className="hero-content">
          <div className="hero-badge">
            <div className="pulse-dot" />
            <span>Live Market Intelligence</span>
          </div>
          <h1 className="hero-title">
            Welcome back, <span className="hero-name">{profile?.name || 'Farmer'}</span> 🌾
          </h1>
          <p className="hero-sub">Smart Agri Trade Network — Connect · Route · Profit</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <IndianRupee size={16} />
              <span>Avg Market Price</span>
              <strong>₹32/kg</strong>
            </div>
            <div className="hero-divider" />
            <div className="hero-stat">
              <Sprout size={16} />
              <span>Active Farmers</span>
              <strong>2,847</strong>
            </div>
            <div className="hero-divider" />
            <div className="hero-stat">
              <ShoppingBag size={16} />
              <span>Live Listings</span>
              <strong>1,234</strong>
            </div>
          </div>
        </div>
        <div className="hero-illustration">🌾</div>
      </div>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginTop: 24 }}>
        {[
          { label: 'Markets Covered', value: '8+', icon: MapPin, color: '#22c55e' },
          { label: 'Crops Listed', value: '10+', icon: Sprout, color: '#f59e0b' },
          { label: 'Trust Score Avg', value: '87/100', icon: Star, color: '#ec4899' },
          { label: 'Cost Saved (Shared)', value: '40%', icon: Truck, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="glass-card stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="stat-icon-box" style={{ background: `${s.color}22`, border: `1px solid ${s.color}44` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <span className="stat-label">{s.label}</span>
            </div>
            <span className="stat-value" style={{
              background: `linear-gradient(135deg, ${s.color}, ${s.color}aa)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Modules */}
      <div style={{ marginTop: 32 }}>
        <h2 className="section-heading">Core Modules</h2>
        <p className="section-sub">Everything you need to trade smarter</p>
        <div className="modules-grid" style={{ marginTop: 16 }}>
          {MODULES.map(m => (
            <Link key={m.to} to={m.to} className="module-card glass-card">
              <div className="module-icon-wrap" style={{ background: m.gradient }}>
                <m.icon size={22} color="white" />
              </div>
              <div className="module-info">
                <div className="module-top">
                  <span className="module-label">{m.label}</span>
                  <span className="module-tag badge badge-success">{m.tag}</span>
                </div>
                <p className="module-desc">{m.desc}</p>
              </div>
              <ArrowRight size={16} className="module-arrow" />
            </Link>
          ))}
        </div>
      </div>

      {/* Live Market Prices */}
      <div style={{ marginTop: 32 }}>
        <h2 className="section-heading">Live Market Prices</h2>
        <p className="section-sub">Today's rates across Tamil Nadu</p>
        <div className="market-table glass-card" style={{ marginTop: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="market-table-header">
                <th>Market</th>
                <th>City</th>
                <th>Demand</th>
                <th>🌾 Rice</th>
                <th>🍅 Tomato</th>
              </tr>
            </thead>
            <tbody>
              {marketPrices.map(m => (
                <tr key={m.id} className="market-table-row">
                  <td className="market-name">{m.name}</td>
                  <td>{m.city}</td>
                  <td>
                    <span className={`badge ${m.demand === 'High' ? 'badge-success' : m.demand === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>
                      {m.demand}
                    </span>
                  </td>
                  <td className="price-cell">₹{m.ricePrice}/kg</td>
                  <td className="price-cell">₹{m.tomatoPrice}/kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
