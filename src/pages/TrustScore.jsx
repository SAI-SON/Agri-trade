import React, { useState } from 'react';
import { Star, Shield, TrendingUp, Zap, Award } from 'lucide-react';
import { analyzeTrustScore } from '../lib/gemini.js';
import toast from 'react-hot-toast';
import './TrustScore.css';

const SAMPLE_FARMERS = [
  {
    id: 'f1', name: 'Rajan Kumar', role: 'farmer', location: 'Thiruvallur',
    trustScore: 92, deliveries: 48, successRate: 98, avgRating: 4.9,
    reviews: [
      { rating: 5, comment: 'Excellent quality tomatoes. Delivered on time. Highly recommended!' },
      { rating: 5, comment: 'Best farmer I have dealt with. Very transparent and honest.' },
      { rating: 4, comment: 'Good quality. Slight delay but informed beforehand.' },
      { rating: 5, comment: 'Superb produce. Will order again.' },
    ],
    badges: ['Top Seller', 'Verified', 'Organic'],
    joinedYear: 2022,
  },
  {
    id: 'f2', name: 'Murugan S', role: 'farmer', location: 'Dharmapuri',
    trustScore: 78, deliveries: 23, successRate: 87, avgRating: 4.2,
    reviews: [
      { rating: 4, comment: 'Good onions, reasonable price.' },
      { rating: 3, comment: 'Some quantity mismatch but resolved quickly.' },
      { rating: 5, comment: 'Fresh produce, very happy.' },
    ],
    badges: ['Verified'],
    joinedYear: 2023,
  },
  {
    id: 'f3', name: 'Vijayalakshmi T', role: 'farmer', location: 'Krishnagiri',
    trustScore: 88, deliveries: 35, successRate: 94, avgRating: 4.6,
    reviews: [
      { rating: 5, comment: 'Alphonso mangoes were superb quality!' },
      { rating: 4, comment: 'Good packaging. Met expectations.' },
      { rating: 5, comment: 'Premium grade. Will buy again.' },
    ],
    badges: ['Verified', 'Export Grade'],
    joinedYear: 2022,
  },
];

function ScoreRing({ score }) {
  const deg = (score / 100) * 360;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#f87171';
  return (
    <div className="score-ring-wrap">
      <div
        className="score-ring"
        style={{
          background: `conic-gradient(${color} ${deg}deg, rgba(34,197,94,0.1) ${deg}deg)`,
        }}
      >
        <div className="score-inner">
          <span className="score-number" style={{ color }}>{score}</span>
          <span className="score-label-sm">/ 100</span>
        </div>
      </div>
    </div>
  );
}

export default function TrustScore() {
  const [selected, setSelected] = useState(SAMPLE_FARMERS[0]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  async function analyzeReviews() {
    setLoading(true);
    try {
      const raw = await analyzeTrustScore(selected.reviews);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setAiAnalysis(JSON.parse(jsonMatch[0]));
      } else {
        setAiAnalysis({ trustScore: selected.trustScore, genuineReviews: 'See below', suspiciousPatterns: 'None detected', recommendation: raw });
      }
      toast.success('AI analysis complete!');
    } catch {
      toast.error('Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  const badgeColor = { 'Top Seller': 'badge-success', 'Verified': 'badge-info', 'Organic': 'badge-warning', 'Export Grade': 'badge-success' };

  return (
    <div className="page-container fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-heading">⭐ Farmer Trust Score System</h1>
        <p className="section-sub">Transparent ratings, verified profiles, trusted trading</p>
      </div>

      <div className="trust-layout">
        {/* Farmer List */}
        <div className="trust-sidebar">
          {SAMPLE_FARMERS.map(f => (
            <button
              key={f.id}
              className={`farmer-card glass-card ${f.id === selected.id ? 'active' : ''}`}
              onClick={() => { setSelected(f); setAiAnalysis(null); }}
            >
              <div className="farmer-avatar-lg">{(f.name)[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{f.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.location}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: f.trustScore >= 80 ? '#22c55e' : '#f59e0b' }}>{f.trustScore}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Trust</div>
              </div>
            </button>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="trust-detail">
          <div className="glass-card" style={{ padding: 24 }}>
            {/* Profile Header */}
            <div className="trust-profile-header">
              <div className="farmer-avatar-xl">{selected.name[0]}</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{selected.name}</h2>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{selected.location} · Farmer since {selected.joinedYear}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selected.badges.map(b => (
                    <span key={b} className={`badge ${badgeColor[b] || 'badge-info'}`}>
                      {b === 'Verified' ? '✓ ' : ''}{b}
                    </span>
                  ))}
                </div>
              </div>
              <ScoreRing score={selected.trustScore} />
            </div>

            {/* Stats */}
            <div className="trust-stats">
              <div className="trust-stat">
                <Award size={18} style={{ color: '#f59e0b' }} />
                <span>{selected.deliveries}</span>
                <label>Deliveries</label>
              </div>
              <div className="trust-stat">
                <TrendingUp size={18} style={{ color: '#22c55e' }} />
                <span>{selected.successRate}%</span>
                <label>Success Rate</label>
              </div>
              <div className="trust-stat">
                <Star size={18} style={{ color: '#fbbf24' }} />
                <span>{selected.avgRating}/5</span>
                <label>Avg Rating</label>
              </div>
              <div className="trust-stat">
                <Shield size={18} style={{ color: '#63b3ed' }} />
                <span>{selected.reviews.length}</span>
                <label>Reviews</label>
              </div>
            </div>

            {/* Reviews */}
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Customer Reviews</h3>
              <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={analyzeReviews} disabled={loading}>
                {loading ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <><Zap size={12} /> AI Verify</>}
              </button>
            </div>
            <div className="reviews-list">
              {selected.reviews.map((r, i) => (
                <div key={i} className="review-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#fbbf24' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Verified Buyer</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.comment}</p>
                </div>
              ))}
            </div>

            {/* AI Analysis */}
            {aiAnalysis && (
              <div className="ai-analysis-card fade-in">
                <div className="ai-badge" style={{ marginBottom: 10 }}><Zap size={12} /> Gemini AI Review Analysis</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>AI Trust Score</div>
                    <div style={{ fontWeight: 800, fontSize: 20, color: '#22c55e' }}>{aiAnalysis.trustScore}/100</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>Genuine Reviews</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{aiAnalysis.genuineReviews}</div>
                  </div>
                </div>
                {aiAnalysis.suspiciousPatterns && (
                  <div style={{ fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Suspicious: </span>
                    <span style={{ color: '#f87171' }}>{aiAnalysis.suspiciousPatterns}</span>
                  </div>
                )}
                {aiAnalysis.recommendation && (
                  <div style={{ fontSize: 13, padding: '10px 12px', background: 'rgba(34,197,94,0.06)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    💡 {aiAnalysis.recommendation}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
