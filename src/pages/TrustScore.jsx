import React, { useEffect, useMemo, useState } from 'react';
import { Star, Shield, TrendingUp, Zap, Award, Flag, CheckCircle2, AlertTriangle } from 'lucide-react';
import { analyzeTrustScore } from '../lib/gemini.js';
import toast from 'react-hot-toast';
import './TrustScore.css';

const CURRENT_USER = {
  id: 'buyer-ravi',
  name: 'Ravi',
  trustScore: 84,
};

const SAMPLE_FARMERS = [
  {
    id: 'f1', name: 'Rajan Kumar', role: 'farmer', location: 'Thiruvallur',
    trustScore: 92, deliveries: 48, successRate: 98, avgRating: 4.9,
    orders: [
      { id: 'o101', buyerId: 'buyer-ravi', crop: 'Tomato', status: 'delivered', reviewed: true },
      { id: 'o102', buyerId: 'buyer-ravi', crop: 'Tomato', status: 'delivered', reviewed: false },
      { id: 'o103', buyerId: 'buyer-arun', crop: 'Onion', status: 'in_transit', reviewed: false },
      { id: 'o104', buyerId: 'buyer-selvi', crop: 'Tomato', status: 'cancelled', reviewed: false },
    ],
    reviews: [
      {
        id: 'r101', orderId: 'o101', reviewerId: 'buyer-ravi', reviewerName: 'Ravi', reviewerTrust: 84,
        rating: 5, comment: 'Excellent quality tomatoes. Delivered on time. Highly recommended!', createdAt: '2026-04-12T09:10:00.000Z',
        reports: 0,
      },
      {
        id: 'r102', orderId: 'o199', reviewerId: 'buyer-priya', reviewerName: 'Priya', reviewerTrust: 88,
        rating: 5, comment: 'Best farmer I have dealt with. Very transparent and honest.', createdAt: '2026-04-13T08:30:00.000Z',
        reports: 0,
      },
      {
        id: 'r103', orderId: 'o177', reviewerId: 'buyer-vikram', reviewerName: 'Vikram', reviewerTrust: 67,
        rating: 4, comment: 'Good quality. Slight delay but informed beforehand.', createdAt: '2026-04-13T10:20:00.000Z',
        reports: 1,
      },
      {
        id: 'r104', orderId: 'o176', reviewerId: 'buyer-kavin', reviewerName: 'Kavin', reviewerTrust: 61,
        rating: 5, comment: 'Superb produce. Will order again.', createdAt: '2026-04-14T07:12:00.000Z',
        reports: 0,
      },
    ],
    badges: ['Top Seller', 'Verified', 'Organic'],
    joinedYear: 2022,
  },
  {
    id: 'f2', name: 'Murugan S', role: 'farmer', location: 'Dharmapuri',
    trustScore: 78, deliveries: 23, successRate: 87, avgRating: 4.2,
    orders: [
      { id: 'o201', buyerId: 'buyer-ravi', crop: 'Onion', status: 'delivered', reviewed: false },
      { id: 'o202', buyerId: 'buyer-ravi', crop: 'Onion', status: 'processing', reviewed: false },
      { id: 'o203', buyerId: 'buyer-karthik', crop: 'Onion', status: 'delivered', reviewed: true },
    ],
    reviews: [
      {
        id: 'r201', orderId: 'o203', reviewerId: 'buyer-karthik', reviewerName: 'Karthik', reviewerTrust: 74,
        rating: 4, comment: 'Good onions, reasonable price.', createdAt: '2026-04-11T12:00:00.000Z',
        reports: 0,
      },
      {
        id: 'r202', orderId: 'o208', reviewerId: 'buyer-john', reviewerName: 'John', reviewerTrust: 45,
        rating: 3, comment: 'Some quantity mismatch but resolved quickly.', createdAt: '2026-04-11T14:30:00.000Z',
        reports: 0,
      },
      {
        id: 'r203', orderId: 'o209', reviewerId: 'buyer-john', reviewerName: 'John', reviewerTrust: 45,
        rating: 5, comment: 'very very very good!!! best!!!', createdAt: '2026-04-11T14:41:00.000Z',
        reports: 2,
      },
    ],
    badges: ['Verified'],
    joinedYear: 2023,
  },
  {
    id: 'f3', name: 'Vijayalakshmi T', role: 'farmer', location: 'Krishnagiri',
    trustScore: 88, deliveries: 35, successRate: 94, avgRating: 4.6,
    orders: [
      { id: 'o301', buyerId: 'buyer-ravi', crop: 'Mango', status: 'delivered', reviewed: false },
      { id: 'o302', buyerId: 'buyer-sundar', crop: 'Mango', status: 'delivered', reviewed: true },
      { id: 'o303', buyerId: 'buyer-deepa', crop: 'Mango', status: 'delivered', reviewed: true },
    ],
    reviews: [
      {
        id: 'r301', orderId: 'o302', reviewerId: 'buyer-sundar', reviewerName: 'Sundar', reviewerTrust: 90,
        rating: 5, comment: 'Alphonso mangoes were superb quality!', createdAt: '2026-04-10T09:30:00.000Z',
        reports: 0,
      },
      {
        id: 'r302', orderId: 'o303', reviewerId: 'buyer-deepa', reviewerName: 'Deepa', reviewerTrust: 79,
        rating: 4, comment: 'Good packaging. Met expectations.', createdAt: '2026-04-10T10:15:00.000Z',
        reports: 0,
      },
      {
        id: 'r303', orderId: 'o304', reviewerId: 'buyer-mani', reviewerName: 'Mani', reviewerTrust: 72,
        rating: 5, comment: 'Premium grade. Will buy again.', createdAt: '2026-04-10T11:45:00.000Z',
        reports: 0,
      },
    ],
    badges: ['Verified', 'Export Grade'],
    joinedYear: 2022,
  },
];

function dateKey(isoDate) {
  return new Date(isoDate).toISOString().slice(0, 10);
}

function detectSuspiciousReview(review, allReviews) {
  const text = (review.comment || '').trim();
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const repeatedWords = words.length >= 6 && uniqueWords.size / words.length < 0.55;
  const overExaggeration = /!{3,}|(very\s+){2,}/i.test(text);
  const tooShortFiveStar = review.rating === 5 && text.length < 5;

  const sameDayCount = allReviews.filter(
    r => r.reviewerId === review.reviewerId && dateKey(r.createdAt) === dateKey(review.createdAt),
  ).length;
  const excessiveDailyReviews = sameDayCount > 3;

  const flags = [];
  if (repeatedWords) flags.push('Repetitive wording');
  if (overExaggeration) flags.push('Over-exaggerated phrasing');
  if (tooShortFiveStar) flags.push('5-star with very short text');
  if (excessiveDailyReviews) flags.push('User exceeded 3 reviews in one day');

  return {
    suspicious: flags.length > 0,
    suspiciousFlags: flags,
    sameDayCount,
  };
}

function calculateWeightedRating(reviews) {
  const visible = reviews.filter(r => !r.hidden);
  if (!visible.length) return 0;
  const totalTrust = visible.reduce((sum, r) => sum + (r.reviewerTrust || 50), 0);
  if (!totalTrust) return 0;
  const weighted = visible.reduce((sum, r) => sum + ((r.reviewerTrust || 50) * r.rating), 0);
  return weighted / totalTrust;
}

function recomputeFarmer(farmer) {
  const normalizedReviews = farmer.reviews.map(r => ({
    ...r,
    reports: r.reports || 0,
    hidden: (r.reports || 0) > 3,
  }));

  const analyzedReviews = normalizedReviews.map(r => {
    const analysis = detectSuspiciousReview(r, normalizedReviews);
    return { ...r, ...analysis };
  });

  const reviewedOrderIds = new Set(analyzedReviews.map(r => r.orderId));
  const orders = farmer.orders.map(order => ({
    ...order,
    reviewed: reviewedOrderIds.has(order.id),
  }));

  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  const spamReports = analyzedReviews.reduce((sum, r) => sum + (r.reports || 0), 0);
  const suspiciousCount = analyzedReviews.filter(r => r.suspicious).length;
  const weightedRating = calculateWeightedRating(analyzedReviews);
  const successRate = orders.length ? Math.round((deliveredOrders.length / orders.length) * 100) : 0;

  const rawTrust = 45
    + (deliveredOrders.length * 2)
    - (spamReports * 5)
    - (suspiciousCount * 4)
    - (cancelledOrders.length * 2);

  const trustScore = Math.max(0, Math.min(100, rawTrust));
  const trustLabel = trustScore >= 80 ? 'High Trust' : trustScore >= 60 ? 'Medium Trust' : 'Low Trust';

  return {
    ...farmer,
    reviews: analyzedReviews,
    orders,
    deliveries: deliveredOrders.length,
    successRate,
    trustScore,
    avgRating: weightedRating || 0,
    weightedRating,
    totalTrustWeight: analyzedReviews
      .filter(r => !r.hidden)
      .reduce((sum, r) => sum + (r.reviewerTrust || 50), 0),
    hiddenReviews: analyzedReviews.filter(r => r.hidden).length,
    trustLabel,
  };
}

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
  const [farmers, setFarmers] = useState(() => SAMPLE_FARMERS.map(recomputeFarmer));
  const [selectedId, setSelectedId] = useState(SAMPLE_FARMERS[0].id);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newReview, setNewReview] = useState({ orderId: '', rating: 5, comment: '' });

  const selected = useMemo(
    () => farmers.find(f => f.id === selectedId) || farmers[0],
    [farmers, selectedId],
  );

  const eligibleOrders = useMemo(
    () => (selected?.orders || []).filter(o => o.buyerId === CURRENT_USER.id && o.status === 'delivered' && !o.reviewed),
    [selected],
  );

  useEffect(() => {
    if (!eligibleOrders.length) {
      setNewReview(p => ({ ...p, orderId: '' }));
      return;
    }
    setNewReview(p => ({ ...p, orderId: p.orderId || eligibleOrders[0].id }));
  }, [eligibleOrders]);

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
    } catch (error) {
      const suspicious = selected.reviews.filter(r => r.suspicious);
      setAiAnalysis({
        trustScore: selected.trustScore,
        genuineReviews: `${selected.reviews.length - suspicious.length}/${selected.reviews.length}`,
        suspiciousPatterns: suspicious.length ? suspicious[0].suspiciousFlags.join(', ') : 'None detected',
        recommendation: 'Gemini unavailable, used local anti-spam checks (repetition, exaggeration, short 5-star, burst reviews).',
      });
      toast.error(error?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  function submitReview(e) {
    e.preventDefault();

    const order = selected.orders.find(o => o.id === newReview.orderId);
    if (!order) {
      toast.error('Select a valid delivered order.');
      return;
    }
    if (order.status !== 'delivered') {
      toast.error('Only delivered orders can be reviewed.');
      return;
    }
    if (order.reviewed) {
      toast.error('One review per order is allowed.');
      return;
    }

    const comment = newReview.comment.trim();
    if (comment.length < 5) {
      toast.error('Review comment should be at least 5 characters.');
      return;
    }

    const reviewEntry = {
      id: `r-${Date.now()}`,
      orderId: order.id,
      reviewerId: CURRENT_USER.id,
      reviewerName: CURRENT_USER.name,
      reviewerTrust: CURRENT_USER.trustScore,
      rating: Number(newReview.rating),
      comment,
      createdAt: new Date().toISOString(),
      reports: 0,
    };

    setFarmers(prev => prev.map(f => (
      f.id !== selected.id ? f : recomputeFarmer({ ...f, reviews: [reviewEntry, ...f.reviews] })
    )));

    setAiAnalysis(null);
    setNewReview({ orderId: '', rating: 5, comment: '' });
    toast.success('Review submitted. Verified purchase check passed.');
  }

  function reportReview(reviewId) {
    setFarmers(prev => prev.map(f => {
      if (f.id !== selected.id) return f;
      const updatedReviews = f.reviews.map(r => (
        r.id === reviewId ? { ...r, reports: (r.reports || 0) + 1 } : r
      ));
      return recomputeFarmer({ ...f, reviews: updatedReviews });
    }));
    toast.success('Review reported for moderation.');
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
          {farmers.map(f => (
            <button
              key={f.id}
              className={`farmer-card glass-card ${f.id === selectedId ? 'active' : ''}`}
              onClick={() => { setSelectedId(f.id); setAiAnalysis(null); }}
            >
              <div className="farmer-avatar-lg">{(f.name)[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{f.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.location}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: f.trustScore >= 80 ? '#22c55e' : '#f59e0b' }}>{f.trustScore}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{f.trustLabel}</div>
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
                  <span className={`badge ${selected.trustScore >= 80 ? 'badge-success' : 'badge-warning'}`}>
                    {selected.trustScore >= 80 ? '⭐ High Trust' : '⚠️ Low Trust'}
                  </span>
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
                <span>{selected.weightedRating?.toFixed(2) || '0.00'}/5</span>
                <label>Weighted Rating</label>
              </div>
              <div className="trust-stat">
                <Shield size={18} style={{ color: '#63b3ed' }} />
                <span>{selected.reviews.length}</span>
                <label>Reviews</label>
              </div>
            </div>

            <div className="guardrail-strip">
              <span className="badge badge-success"><CheckCircle2 size={12} /> Verified purchase only</span>
              <span className="badge badge-info">1 review per delivered order</span>
              <span className="badge badge-warning">Weighted by reviewer trust</span>
            </div>

            <div className="review-form-card">
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Write Review</h3>
              <form onSubmit={submitReview} className="review-form-grid">
                <div className="form-group">
                  <label className="input-label">Eligible Delivered Order</label>
                  <select
                    className="input-field"
                    value={newReview.orderId}
                    onChange={e => setNewReview(p => ({ ...p, orderId: e.target.value }))}
                    disabled={!eligibleOrders.length}
                  >
                    {!eligibleOrders.length && <option value="">No delivered orders available</option>}
                    {eligibleOrders.map(o => (
                      <option key={o.id} value={o.id}>{o.id} - {o.crop}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="input-label">Rating</label>
                  <select
                    className="input-field"
                    value={newReview.rating}
                    onChange={e => setNewReview(p => ({ ...p, rating: Number(e.target.value) }))}
                    disabled={!eligibleOrders.length}
                  >
                    {[5, 4, 3, 2, 1].map(v => <option key={v} value={v}>{v} Star</option>)}
                  </select>
                </div>
                <div className="form-group review-comment-group">
                  <label className="input-label">Comment</label>
                  <textarea
                    rows={2}
                    className="input-field"
                    value={newReview.comment}
                    onChange={e => setNewReview(p => ({ ...p, comment: e.target.value }))}
                    placeholder="Share delivery quality and service experience"
                    disabled={!eligibleOrders.length}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={!eligibleOrders.length}>Submit Verified Review</button>
              </form>
              {!eligibleOrders.length && (
                <p className="review-hint"><AlertTriangle size={13} /> Review is enabled only after delivery, and only once per order.</p>
              )}
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
                <div key={r.id || i} className={`review-item ${r.hidden ? 'review-hidden' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#fbbf24' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Verified Buyer</span>
                    <span className="badge badge-info">Trust {r.reviewerTrust || 50}</span>
                    <span className={`badge ${r.suspicious ? 'badge-warning' : 'badge-success'}`}>
                      {r.suspicious ? 'Likely Fake' : 'Genuine'}
                    </span>
                    {r.hidden && <span className="badge badge-danger">Hidden: reports &gt; 3</span>}
                  </div>
                  {!r.hidden && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.comment}</p>}
                  {r.hidden && <p style={{ fontSize: 13, color: '#f87171', lineHeight: 1.5 }}>This review is hidden due to repeated spam/fake reports.</p>}
                  {r.suspiciousFlags?.length > 0 && !r.hidden && (
                    <p className="review-flags">⚠ {r.suspiciousFlags.join(' | ')}</p>
                  )}
                  <div className="review-actions">
                    <button className="btn btn-secondary" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => reportReview(r.id)} disabled={r.hidden}>
                      <Flag size={12} /> Report Review
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Reports: {r.reports || 0}</span>
                  </div>
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
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Weighted rating formula: (sum of reviewerTrust x rating) / total reviewer trust.
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
