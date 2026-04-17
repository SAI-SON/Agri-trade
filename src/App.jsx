import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DemandRouting from './pages/DemandRouting.jsx';
import Marketplace from './pages/Marketplace.jsx';
import SharedTransport from './pages/SharedTransport.jsx';
import DemandPrediction from './pages/DemandPrediction.jsx';
import TrustScore from './pages/TrustScore.jsx';
import Chat from './pages/Chat.jsx';
import Profile from './pages/Profile.jsx';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Routes><Route path="*" element={<AuthPage />} /></Routes>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/demand-routing" element={<ProtectedRoute><DemandRouting /></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/shared-transport" element={<ProtectedRoute><SharedTransport /></ProtectedRoute>} />
            <Route path="/demand-prediction" element={<ProtectedRoute><DemandPrediction /></ProtectedRoute>} />
            <Route path="/trust-score" element={<ProtectedRoute><TrustScore /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
