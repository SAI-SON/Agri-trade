import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, LogOut, Leaf } from 'lucide-react';
import { useAuth } from '../context/useAuth.jsx';
import toast from 'react-hot-toast';
import './Navbar.css';

export default function Navbar({ onMenuClick }) {
  const { user, profile, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-menu-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div className="navbar-brand">
          <Leaf size={18} className="navbar-leaf" />
          <span className="navbar-title">Smart Agri Trade Network</span>
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-market-ticker">
          <span className="ticker-item">🍅 Tomato ₹28/kg ↑</span>
          <span className="ticker-item">🧅 Onion ₹35/kg →</span>
          <span className="ticker-item">🌾 Rice ₹48/kg ↑</span>
        </div>
        <button className="icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>
        <div className="navbar-user">
          <div className="user-avatar">
            {(profile?.name || user?.displayName || 'F')[0].toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{profile?.name || user?.displayName || 'Farmer'}</span>
            <span className="user-role">{profile?.role || 'User'}</span>
          </div>
        </div>
        <button className="icon-btn btn-danger" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
