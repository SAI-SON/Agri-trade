import React, { useState } from 'react';
import { useAuth } from '../context/useAuth.jsx';
import { Leaf, Eye, EyeOff, User, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import './AuthPage.css';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'farmer', location: 'Chennai',
  });

  function change(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back! 🌾');
      } else {
        await register(form.email, form.password, form.name, form.role, form.location);
        toast.success('Account created! Welcome to AgriTrade 🌾');
      }
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  const DEMO_ACCOUNTS = [
    { label: 'Demo Farmer', email: 'farmer@demo.com', password: 'demo123456' },
    { label: 'Demo Buyer', email: 'buyer@demo.com', password: 'demo123456' },
  ];

  function fillDemo(acc) {
    setForm(p => ({ ...p, email: acc.email, password: acc.password }));
    setMode('login');
  }

  return (
    <div className="auth-bg">
      <div className="auth-particles">
        {[...Array(10)].map((_, i) => {
          const left = (i * 17) % 100;
          const delay = (i % 4) * 0.75;
          const duration = 4 + (i % 4);
          return (
            <div key={i} className="auth-particle" style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }} />
          );
        })}
      </div>

      <div className="auth-container fade-in">
        <div className="auth-card glass-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon"><Leaf size={28} /></div>
            </div>
            <h1 className="auth-title">Smart Agri Trade</h1>
            <p className="auth-subtitle">Connect farmers to markets intelligently</p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >Sign In</button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >Create Account</button>
          </div>

          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="input-label">Full Name</label>
                  <input
                    className="input-field" name="name" required
                    placeholder="Your full name" value={form.name} onChange={change}
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">I am a</label>
                  <div className="role-selector">
                    <button
                      type="button"
                      className={`role-btn ${form.role === 'farmer' ? 'active' : ''}`}
                      onClick={() => setForm(p => ({ ...p, role: 'farmer' }))}
                    ><User size={16} /> Farmer</button>
                    <button
                      type="button"
                      className={`role-btn ${form.role === 'buyer' ? 'active' : ''}`}
                      onClick={() => setForm(p => ({ ...p, role: 'buyer' }))}
                    ><ShoppingCart size={16} /> Buyer</button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="input-label">Location</label>
                  <select className="input-field" name="location" value={form.location} onChange={change}>
                    <option>Chennai</option><option>Coimbatore</option>
                    <option>Madurai</option><option>Salem</option>
                    <option>Trichy</option><option>Erode</option>
                    <option>Dharmapuri</option><option>Namakkal</option>
                    <option>Krishnagiri</option><option>Theni</option>
                  </select>
                </div>
              </>
            )}
            <div className="form-group">
              <label className="input-label">Email</label>
              <input
                className="input-field" name="email" type="email" required
                placeholder="you@example.com" value={form.email} onChange={change}
              />
            </div>
            <div className="form-group">
              <label className="input-label">Password</label>
              <div className="pw-wrapper">
                <input
                  className="input-field" name="password"
                  type={showPw ? 'text' : 'password'} required
                  placeholder="••••••••" value={form.password} onChange={change}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '13px' }} disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing...</> : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="auth-demo">
            <div className="divider" />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', opacity: 0.7, textAlign: 'center', marginBottom: 8 }}>Try with demo accounts</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.email} className="btn btn-secondary" style={{ flex: 1, fontSize: 12, padding: '8px' }} onClick={() => fillDemo(acc)}>
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="auth-features">
          {[
            { emoji: '📊', text: 'Demand Analysis' },
            { emoji: '🚚', text: 'Smart Routing' },
            { emoji: '🛒', text: 'Direct Selling' },
            { emoji: '⭐', text: 'Trust Score' },
            { emoji: '💬', text: 'Live Chat' },
          ].map(f => (
            <div key={f.text} className="auth-feature-chip">
              <span>{f.emoji}</span> {f.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
