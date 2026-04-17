import React, { useState } from 'react';
import { FARMER_LOCATIONS, MARKETS, groupFarmersForSharedTransport, getDistance } from '../lib/data.js';
import { Truck, Users, IndianRupee, MapPin, Route } from 'lucide-react';
import toast from 'react-hot-toast';
import './SharedTransport.css';

const SAMPLE_FARMERS = [
  { id: 'f1', name: 'Rajan Kumar', location: FARMER_LOCATIONS[0], crop: 'Tomato', quantity: 200, lat: 13.1428, lng: 79.9078 },
  { id: 'f2', name: 'Murugan S', location: FARMER_LOCATIONS[1], crop: 'Onion', quantity: 300, lat: 12.2253, lng: 79.0747 },
  { id: 'f3', name: 'Selvaraj P', location: FARMER_LOCATIONS[2], crop: 'Rice', quantity: 500, lat: 11.2180, lng: 78.1672 },
  { id: 'f4', name: 'Vijayalakshmi T', location: FARMER_LOCATIONS[3], crop: 'Mango', quantity: 150, lat: 12.5266, lng: 78.2141 },
  { id: 'f5', name: 'Krishnaswamy R', location: FARMER_LOCATIONS[4], crop: 'Chilli', quantity: 80, lat: 11.9401, lng: 79.4861 },
  { id: 'f6', name: 'Saraswathi D', location: FARMER_LOCATIONS[5], crop: 'Groundnut', quantity: 400, lat: 12.5266, lng: 78.1141 },
];

export default function SharedTransport() {
  const [farmers] = useState(SAMPLE_FARMERS);
  const [selectedTarget, setSelectedTarget] = useState(MARKETS[0]);
  const [groups, setGroups] = useState([]);
  const [computed, setComputed] = useState(false);

  function computeGroups() {
    const farmerData = farmers.map(f => ({ ...f, lat: f.lat, lng: f.lng }));
    const grouped = groupFarmersForSharedTransport(farmerData);
    const enriched = grouped.map((group, idx) => {
      const centroidLat = group.reduce((s, f) => s + f.lat, 0) / group.length;
      const centroidLng = group.reduce((s, f) => s + f.lng, 0) / group.length;
      const distToMarket = getDistance(centroidLat, centroidLng, selectedTarget.lat, selectedTarget.lng);
      const distToMarketRnd = Math.round(distToMarket);
      const individualCosts = group.map(f => {
        const d = getDistance(f.lat, f.lng, selectedTarget.lat, selectedTarget.lng);
        return Math.round(d * selectedTarget.transportCostPerKm);
      });
      const totalIndividual = individualCosts.reduce((s, c) => s + c, 0);
      const sharedCost = Math.round(distToMarketRnd * selectedTarget.transportCostPerKm * 1.2); // truck cost
      const perFarmer = Math.round(sharedCost / group.length);
      const savings = totalIndividual - sharedCost;
      const savingsPct = Math.round((savings / totalIndividual) * 100);
      return {
        groupId: idx + 1,
        farmers: group,
        distToMarket: distToMarketRnd,
        totalIndividual,
        sharedCost,
        perFarmer,
        savings: Math.max(0, savings),
        savingsPct: Math.max(0, savingsPct),
        totalQuantity: group.reduce((s, f) => s + f.quantity, 0),
      };
    });
    setGroups(enriched);
    setComputed(true);
    toast.success(`${grouped.length} transport groups optimized!`);
  }

  return (
    <div className="page-container fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-heading">🚚 Shared Transport Routing</h1>
        <p className="section-sub">Group nearby farmers, share trucks, reduce your costs by up to 40%</p>
      </div>

      {/* Controls */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label className="input-label">Target Market</label>
            <select className="input-field" value={selectedTarget.id}
              onChange={e => setSelectedTarget(MARKETS.find(m => m.id === e.target.value))}>
              {MARKETS.map(m => <option key={m.id} value={m.id}>{m.name}, {m.city}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={computeGroups}>
            <Route size={16} /> Optimize Groups
          </button>
        </div>
      </div>

      {/* Farmer Table */}
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-heading" style={{ fontSize: 17, marginBottom: 12 }}>
          Registered Farmers ({farmers.length})
        </h2>
        <div className="glass-card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['Farmer', 'Location', 'Crop', 'Quantity'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {farmers.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid rgba(34,197,94,0.05)' }}>
                  <td style={{ padding: '11px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</td>
                  <td style={{ padding: '11px 16px', color: 'var(--text-secondary)' }}><MapPin size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{f.location.name}</td>
                  <td style={{ padding: '11px 16px' }}><span className="badge badge-success">{f.crop}</span></td>
                  <td style={{ padding: '11px 16px', fontWeight: 700, color: 'var(--green-400)' }}>{f.quantity} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transport Groups */}
      {computed && (
        <div className="fade-in">
          <h2 className="section-heading" style={{ fontSize: 17, marginBottom: 12 }}>
            Optimized Transport Groups → {selectedTarget.name}
          </h2>
          <div className="transport-groups">
            {groups.map(group => (
              <div key={group.groupId} className="transport-group glass-card">
                <div className="group-header">
                  <div className="group-title">
                    <div className="group-icon"><Truck size={18} /></div>
                    <span>Group {group.groupId}</span>
                    <span className="badge badge-info">{group.farmers.length} farmers</span>
                  </div>
                  <div className="group-saving">
                    <span>Saves</span>
                    <strong>{group.savingsPct}%</strong>
                  </div>
                </div>

                <div className="group-farmers">
                  {group.farmers.map(f => (
                    <div key={f.id} className="group-farmer">
                      <div className="farmer-dot" />
                      <span>{f.name}</span>
                      <span className="badge badge-success" style={{ fontSize: 10 }}>{f.crop}</span>
                    </div>
                  ))}
                </div>

                <div className="group-costs">
                  <div className="cost-item">
                    <span>Distance to Market</span>
                    <strong>{group.distToMarket} km</strong>
                  </div>
                  <div className="cost-item">
                    <span>Total Quantity</span>
                    <strong>{group.totalQuantity} kg</strong>
                  </div>
                  <div className="cost-item strike">
                    <span>If Individual</span>
                    <strong>₹{group.totalIndividual}</strong>
                  </div>
                  <div className="cost-item shared">
                    <span>Shared Truck</span>
                    <strong>₹{group.sharedCost}</strong>
                  </div>
                  <div className="cost-item per">
                    <span>Per Farmer</span>
                    <strong>₹{group.perFarmer}</strong>
                  </div>
                  <div className="cost-item saved">
                    <span>Money Saved</span>
                    <strong>₹{group.savings}</strong>
                  </div>
                </div>

                <div className="group-route">
                  <MapPin size={13} />
                  Route: {group.farmers.map(f => f.location.name).join(' → ')} → {selectedTarget.city}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
