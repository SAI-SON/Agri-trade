import React, { useEffect, useState } from 'react';
import { auth, firestore } from '../lib/firebase';
import { AuthContext } from './authContext.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const DEMO_SESSION_KEY = 'smart-agri-trade-demo-session';

const DEMO_PROFILES = {
  'farmer@demo.com': {
    uid: 'demo-farmer',
    name: 'Demo Farmer',
    email: 'farmer@demo.com',
    role: 'farmer',
    location: 'Chennai',
    trustScore: 94,
    totalOrders: 42,
    successfulDeliveries: 39,
    avgRating: 4.9,
    reviews: [],
    verified: true,
    createdAt: 'demo',
  },
  'buyer@demo.com': {
    uid: 'demo-buyer',
    name: 'Demo Buyer',
    email: 'buyer@demo.com',
    role: 'buyer',
    location: 'Coimbatore',
    trustScore: 90,
    totalOrders: 28,
    successfulDeliveries: 27,
    avgRating: 4.8,
    reviews: [],
    verified: true,
    createdAt: 'demo',
  },
};

const INITIAL_DEMO_SESSION = readDemoSession();

function readDemoSession() {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDemoSession(profile) {
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(profile));
}

function clearDemoSession() {
  localStorage.removeItem(DEMO_SESSION_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (
    INITIAL_DEMO_SESSION
      ? { uid: INITIAL_DEMO_SESSION.uid, email: INITIAL_DEMO_SESSION.email, displayName: INITIAL_DEMO_SESSION.name }
      : null
  ));
  const [profile, setProfile] = useState(() => INITIAL_DEMO_SESSION);
  const [loading, setLoading] = useState(() => !INITIAL_DEMO_SESSION);

  useEffect(() => {
    if (INITIAL_DEMO_SESSION) {
      return () => {};
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(firestore, 'users', u.uid));
          if (snap.exists()) setProfile(snap.data());
        } catch (e) { console.error(e); }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function register(email, password, name, role, location) {
    if (DEMO_PROFILES[email]) {
      const demoProfile = { ...DEMO_PROFILES[email], name, role, location, email };
      setUser({ uid: demoProfile.uid, email: demoProfile.email, displayName: demoProfile.name });
      setProfile(demoProfile);
      writeDemoSession(demoProfile);
      return { uid: demoProfile.uid, email: demoProfile.email, displayName: demoProfile.name };
    }

    const { user: u } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(u, { displayName: name });
    const profileData = {
      uid: u.uid, name, email, role, location,
      trustScore: 70, totalOrders: 0, successfulDeliveries: 0,
      avgRating: 0, reviews: [], verified: false,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(firestore, 'users', u.uid), profileData);
    setProfile(profileData);
    clearDemoSession();
    return u;
  }

  async function login(email, password) {
    const demoProfile = DEMO_PROFILES[email];
    if (demoProfile && password === 'demo123456') {
      setUser({ uid: demoProfile.uid, email: demoProfile.email, displayName: demoProfile.name });
      setProfile(demoProfile);
      writeDemoSession(demoProfile);
      return { uid: demoProfile.uid, email: demoProfile.email, displayName: demoProfile.name };
    }

    const { user: u } = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(firestore, 'users', u.uid));
    if (snap.exists()) setProfile(snap.data());
    clearDemoSession();
    return u;
  }

  async function logout() {
    clearDemoSession();
    await signOut(auth);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

