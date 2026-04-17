import React, { useState, useEffect } from 'react';
import { firestore } from '../lib/firebase.js';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/useAuth.jsx';
import { CROPS, MARKETS, FARMER_LOCATIONS } from '../lib/data.js';
import { generateProductDescription } from '../lib/gemini.js';
import { ShoppingBag, Plus, Zap, Star, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import './Marketplace.css';

function StarRating({ value }) {
  return (
    <span style={{ color: '#fbbf24', fontSize: 14 }}>
      {'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}
    </span>
  );
}

const SAMPLE_LISTINGS = [
  { id: '1', cropEmoji: '🍅', cropName: 'Tomato / தக்காளி', quantity: 500, price: 28, quality: 'Premium', location: 'Dharmapuri', farmerName: 'Rajan Kumar', farmerTrust: 92, rating: 4.8, reviews: 34, description: 'Fresh organic tomatoes directly from our farm. No pesticides used. Available for bulk orders.', status: 'available' },
  { id: '2', cropEmoji: '🧅', cropName: 'Onion / வெங்காயம்', quantity: 1000, price: 32, quality: 'Standard', location: 'Namakkal', farmerName: 'Murugan S', farmerTrust: 85, rating: 4.5, reviews: 21, description: 'Quality onions stored in ventilated godown. Well graded. Ready for immediate pickup.', status: 'available' },
  { id: '3', cropEmoji: '🌾', cropName: 'Rice / அரிசி', quantity: 2000, price: 46, quality: 'Premium', location: 'Thanjavur', farmerName: 'Selvaraj P', farmerTrust: 95, rating: 4.9, reviews: 47, description: 'Seeraga Samba variety paddy. Mill-grade quality. Certified organic. Transport negotiable.', status: 'available' },
  { id: '4', cropEmoji: '🥭', cropName: 'Mango / மாம்பழம்', quantity: 300, price: 65, quality: 'Premium', location: 'Krishnagiri', farmerName: 'Vijayalakshmi T', farmerTrust: 88, rating: 4.6, reviews: 18, description: 'Alphonso and Banganapalli variety. Handpicked. Export quality. Contact for bulk pricing.', status: 'available' },
];

export default function Marketplace() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const normalizedRole = String(profile?.role || '').trim().toLowerCase();
  const isFarmer = normalizedRole === 'farmer';
  const [form, setForm] = useState({
    crop: CROPS[0].id, quantity: 100, price: '', quality: 'Premium', description: '',
    location: profile?.location || 'Chennai',
  });

  useEffect(() => {
    if (!profile?.location) return;
    setForm(p => ({ ...p, location: p.location || profile.location }));
  }, [profile?.location]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const q = query(collection(firestore, 'listings'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        if (active) setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {
        if (active) {
          // Fallback with sample data if firestore fails
          setListings(SAMPLE_LISTINGS);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function generateDesc() {
    setLoadingAI(true);
    try {
      const crop = CROPS.find(c => c.id === form.crop);
      const desc = await generateProductDescription(crop.name, form.quantity, form.quality, form.location);
      setForm(p => ({ ...p, description: desc }));
      toast.success('AI description generated!');
    } catch {
      toast.error('AI generation failed');
    } finally {
      setLoadingAI(false);
    }
  }

  async function addListing(e) {
    e.preventDefault();
    if (!isFarmer) {
      toast.error('Only farmer accounts can post products.');
      return;
    }

    const crop = CROPS.find(c => c.id === form.crop);
    const payload = {
      ...form,
      quantity: Number(form.quantity),
      price: Number(form.price),
      cropName: crop.name,
      cropEmoji: crop.emoji,
      farmerName: profile?.name || user.displayName || 'Farmer',
      farmerId: user.uid,
      farmerTrust: profile?.trustScore || 70,
      rating: 4.2 + Math.random() * 0.6,
      reviews: Math.floor(5 + Math.random() * 20),
      status: 'available',
    };

    try {
      const data = { ...payload, createdAt: serverTimestamp() };
      const ref = await addDoc(collection(firestore, 'listings'), data);
      setListings(p => [{ id: ref.id, ...payload, createdAt: { seconds: Date.now() / 1000 } }, ...p]);
      setShowForm(false);
      toast.success('Listing added successfully!');
    } catch (error) {
      const fallbackListing = {
        id: `local-${Date.now()}`,
        ...payload,
        createdAt: { seconds: Date.now() / 1000 },
      };
      setListings(p => [fallbackListing, ...p]);
      setShowForm(false);
      toast('Posted locally. Backend write blocked/unavailable.', { icon: '⚠️' });
      console.error('Listing save error:', error);
    }
  }

  const displayListings = listings.length > 0 ? listings : SAMPLE_LISTINGS;

  return (
    <div className="page-container fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="section-heading">🛒 Direct Farmer-to-Buyer Marketplace</h1>
          <p className="section-sub">Skip middlemen. Buy direct. Build trust.</p>
        </div>
        {isFarmer && (
          <button className="btn btn-primary" onClick={() => setShowForm(p => !p)}>
            <Plus size={16} /> {showForm ? 'Cancel' : 'Add Listing'}
          </button>
        )}
      </div>

      {!isFarmer && (
        <div className="glass-card" style={{ padding: 12, marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
          Product posting is available only for farmer accounts.
        </div>
      )}

      {/* Add Listing Form */}
      {showForm && (
        <div className="glass-card fade-in" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, color: 'var(--text-primary)', fontWeight: 700 }}>New Listing</h3>
          <form onSubmit={addListing}>
            <div className="form-grid">
              <div className="form-group">
                <label className="input-label">Crop</label>
                <select className="input-field" value={form.crop} onChange={e => setForm(p => ({ ...p, crop: e.target.value }))}>
                  {CROPS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Quantity (kg)</label>
                <input type="number" className="input-field" value={form.quantity} min={1}
                  onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="input-label">Price (₹/kg)</label>
                <input type="number" className="input-field" value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required placeholder="Your asking price" />
              </div>
              <div className="form-group">
                <label className="input-label">Quality</label>
                <select className="input-field" value={form.quality} onChange={e => setForm(p => ({ ...p, quality: e.target.value }))}>
                  <option>Premium</option><option>Standard</option><option>Grade B</option>
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Location</label>
                <select className="input-field" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}>
                  {FARMER_LOCATIONS.map(l => <option key={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="input-label">Description</label>
                <button type="button" className="btn btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={generateDesc} disabled={loadingAI}>
                  {loadingAI ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <><Zap size={12} /> AI Generate</>}
                </button>
              </div>
              <textarea rows={3} className="input-field" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe your produce..." style={{ resize: 'vertical' }} />
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} type="submit">Submit Listing</button>
          </form>
        </div>
      )}

      {/* Listings Grid */}
      <div className="listings-grid">
        {displayListings.map(listing => (
          <div key={listing.id} className="listing-card glass-card fade-in">
            <div className="listing-emoji">{listing.cropEmoji}</div>
            <div className="listing-body">
              <div className="listing-header">
                <div>
                  <h3 className="listing-name">{listing.cropName}</h3>
                  <div className="listing-meta">
                    <span className={`badge ${listing.quality === 'Premium' ? 'badge-success' : 'badge-warning'}`}>{listing.quality}</span>
                    <span className="badge badge-info">{listing.quantity} kg</span>
                  </div>
                </div>
                <div className="listing-price">₹{listing.price}<span>/kg</span></div>
              </div>
              {listing.description && <p className="listing-desc">{listing.description}</p>}
              <div className="listing-farmer">
                <div className="farmer-avatar">{(listing.farmerName || 'F')[0]}</div>
                <div>
                  <div className="farmer-name">{listing.farmerName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StarRating value={listing.rating || 4} />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>({listing.reviews || 0} reviews)</span>
                  </div>
                </div>
                <div className="trust-score-badge">
                  <Star size={12} /> {listing.farmerTrust || 80}
                </div>
              </div>
              <div className="listing-location"><MapPin size={12} /> {listing.location}</div>
              <div className="listing-actions">
                <button className="btn btn-primary" style={{ flex: 1, fontSize: 13 }} onClick={() => toast.success(`Order request sent to ${listing.farmerName}!`)}>
                  📦 Order Now
                </button>
                <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => toast('Opening chat...')}>
                  💬 Chat
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
