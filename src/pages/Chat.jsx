import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase.js';
import { ref, push, onValue } from 'firebase/database';
import { useAuth } from '../context/useAuth.jsx';
import { Send, MessageCircle } from 'lucide-react';
import './Chat.css';

export default function Chat() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [room, setRoom] = useState('general');

  const ROOMS = [
    { id: 'general', label: '🌾 General' },
    { id: 'tomato', label: '🍅 Tomato Market' },
    { id: 'onion', label: '🧅 Onion Market' },
    { id: 'rice', label: '🌾 Rice Market' },
    { id: 'transport', label: '🚚 Transport' },
  ];

  useEffect(() => {
    const msgRef = ref(db, `chat/${room}`);
    const unsub = onValue(msgRef, snap => {
      const data = snap.val();
      if (data) {
        const msgs = Object.values(data)
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-50);
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    });
    return () => unsub();
  }, [room]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await push(ref(db, `chat/${room}`), {
        text: text.trim(),
        uid: user.uid,
        name: profile?.name || user.displayName || 'User',
        role: profile?.role || 'user',
        timestamp: Date.now(),
      });
      setText('');
    } catch (err) {
      console.error('Chat error:', err);
    }
  }

  function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="page-container fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', padding: '16px 20px' }}>
      <div style={{ marginBottom: 12 }}>
        <h1 className="section-heading">💬 Live Market Chat</h1>
        <p className="section-sub">Real-time chat between farmers and buyers</p>
      </div>

      <div className="chat-layout glass-card" style={{ flex: 1, minHeight: 0 }}>
        {/* Room Sidebar */}
        <div className="chat-rooms">
          <div className="chat-rooms-title">Channels</div>
          {ROOMS.map(r => (
            <button
              key={r.id}
              className={`chat-room-btn ${r.id === room ? 'active' : ''}`}
              onClick={() => setRoom(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="chat-main">
          <div className="chat-messages" id="chat-scroll">
            {messages.length === 0 && (
              <div className="chat-empty">
                <MessageCircle size={32} opacity={0.3} />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-message ${msg.uid === user.uid ? 'own' : 'other'}`}
              >
                {msg.uid !== user.uid && (
                  <div className="msg-avatar">
                    {(msg.name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="msg-content">
                  {msg.uid !== user.uid && (
                    <div className="msg-meta">
                      <span className="msg-name">{msg.name}</span>
                      <span className={`badge ${msg.role === 'farmer' ? 'badge-success' : 'badge-info'}`} style={{ fontSize: 10 }}>
                        {msg.role}
                      </span>
                    </div>
                  )}
                  <div className="msg-bubble">{msg.text}</div>
                  <div className="msg-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>

          <form className="chat-input-bar" onSubmit={send}>
            <input
              className="input-field"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Message #${room}...`}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" type="submit" disabled={!text.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
