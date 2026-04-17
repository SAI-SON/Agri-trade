import React, { useState } from 'react';
import { useAuth } from '../context/useAuth.jsx';
import { firestore } from '../lib/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Star, Package, Truck, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
  const { user, profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: profile?.name || '', location: profile?.location || '' });

  async function save() {
    try {
      await updateDoc(doc(firestore, 'users', user.uid), { name: form.name, location: form.location });
      toast.success('Profile updated!');
      setEditing(false);
    } catch {
      toast.error('Update failed');
    }
  }

  const stats = [
    { label: 'Trust Score', value: profile?.trustScore || 70, icon: Star, color: '#fbbf24', suffix: '/100' },
    { label: 'Total Orders', value: profile?.totalOrders || 0, icon: Package, color: '#22c55e', suffix: '' },
    { label: 'Deliveries', value: profile?.successfulDeliveries || 0, icon: Truck, color: '#63b3ed', suffix: '' },
    { label: 'Avg Rating', value: profile?.avgRating || 0, icon: Star, color: '#ec4899', suffix: '/5' },
  ];

  return (
    <div className="page-container fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-heading">👤 My Profile</h1>
        <p className="section-sub">Manage your account and trust credentials</p>
      </div>

      <div className="profile-layout">
        {/* Profile Card */}
        <div className="glass-card profile-card">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {(profile?.name || user?.displayName || 'U')[0].toUpperCase()}
            </div>
            {profile?.verified && <div className="verified-badge">✓ Verified</div>}
          </div>
          {editing ? (
            <div className="profile-edit-form">
              <div className="form-group">
                <label className="input-label">Name</label>
                <input className="input-field" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="input-label">Location</label>
                <input className="input-field" value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary" onClick={save}><Save size={14} /> Save</button>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h2 className="profile-name">{profile?.name || user?.displayName || 'User'}</h2>
              <p className="profile-email">{user?.email}</p>
              <span className={`badge ${profile?.role === 'farmer' ? 'badge-success' : 'badge-info'}`} style={{ margin: '8px auto' }}>
                {profile?.role === 'farmer' ? '🌱 Farmer' : '🛒 Buyer'}
              </span>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{profile?.location}</div>
              <button className="btn btn-secondary" style={{ marginTop: 16, width: '100%' }} onClick={() => setEditing(true)}>
                <Edit3 size={14} /> Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            {stats.map(s => (
              <div key={s.label} className="glass-card stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: `${s.color}22`, border: `1px solid ${s.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={18} style={{ color: s.color }} />
                  </div>
                  <span className="stat-label">{s.label}</span>
                </div>
                <span className="stat-value" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {s.value}{s.suffix}
                </span>
              </div>
            ))}
          </div>

          {/* Trust Score Bar */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Trust Score Breakdown</h3>
            {[
              { label: 'Delivery Success', score: 98 },
              { label: 'Product Quality', score: 92 },
              { label: 'Response Time', score: 85 },
              { label: 'Price Accuracy', score: 90 },
            ].map(item => (
              <div key={item.label} className="trust-bar-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-400)' }}>{item.score}%</span>
                </div>
                <div className="trust-bar-bg">
                  <div className="trust-bar-fill" style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
