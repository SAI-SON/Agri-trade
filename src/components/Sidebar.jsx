import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, MapPin, ShoppingBag, Truck,
  TrendingUp, Star, MessageCircle, User, X, Leaf
} from 'lucide-react';
import './Sidebar.css';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/demand-routing', icon: MapPin, label: 'Demand Routing' },
  { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { to: '/shared-transport', icon: Truck, label: 'Shared Transport' },
  { to: '/demand-prediction', icon: TrendingUp, label: 'AI Prediction' },
  { to: '/trust-score', icon: Star, label: 'Trust Score' },
  { to: '/chat', icon: MessageCircle, label: 'Live Chat' },
  { to: '/profile', icon: User, label: 'My Profile' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon"><Leaf size={22} /></div>
          <div>
            <div className="logo-title">AgriTrade</div>
            <div className="logo-sub">Smart Network</div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => {
            const NavIcon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <NavIcon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-badge">
            <div className="pulse-dot" />
            <span>Live Market Data</span>
          </div>
        </div>
      </aside>
    </>
  );
}
