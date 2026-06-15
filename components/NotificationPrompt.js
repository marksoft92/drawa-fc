'use client';
import { useState, useEffect } from 'react';

const MONTHS = {
  sty: 0, styczeń: 0, lut: 1, luty: 1, mar: 2, marzec: 2,
  kwi: 3, kwiecień: 3, maj: 4, cze: 5, czerwiec: 5,
  lip: 6, lipiec: 6, sie: 7, sierpień: 7, wrz: 8, wrzesień: 8,
  'paź': 9, październik: 9, lis: 10, listopad: 10, gru: 11, grudzień: 11,
};

function parseDate(str) {
  if (!str) return null;
  const tokens = str.replace(',', '').toLowerCase().split(/\s+/);
  let day = null, month = null, year = null, h = 0, m = 0;
  for (const t of tokens) {
    if (/^\d{1,2}:\d{2}$/.test(t)) { [h, m] = t.split(':').map(Number); continue; }
    if (/^\d{4}$/.test(t)) { year = +t; continue; }
    if (/^\d{1,2}$/.test(t)) { day = +t; continue; }
    const key = Object.keys(MONTHS).find(k => t.startsWith(k));
    if (key !== undefined) month = MONTHS[key];
  }
  if (day === null || month === null) return null;
  if (year === null) year = month >= 6 ? 2025 : 2026;
  return new Date(year, month, day, h, m, 0);
}

async function maybeNotify() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!navigator.serviceWorker) return;

  const next = await fetch('/api/liga/nextmatch').then(r => r.json()).catch(() => null);
  if (!next) return;

  const matchDate = parseDate(next.date);
  if (!matchDate) return;

  const now = new Date();
  const diffMs = matchDate - now;
  const diffH = diffMs / 3600000;

  const today = now.toDateString();
  const lastShown = localStorage.getItem('drawa_notif_shown');
  if (lastShown === today) return;

  const reg = await navigator.serviceWorker.ready;

  if (diffH >= 0 && diffH <= 3) {
    // Match starting soon
    const opp = next.team1.toLowerCase().includes('drawa') ? next.team2 : next.team1;
    reg.showNotification('Mecz już za chwilę! ⚽', {
      body: `Drawa vs ${opp} · ${next.date}`,
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      tag: 'drawa-match',
    });
    localStorage.setItem('drawa_notif_shown', today);
  } else if (diffH > 3 && diffH <= 26) {
    // Match today or tomorrow
    const label = diffH <= 24 ? 'Dziś mecz!' : 'Jutro mecz!';
    const opp = next.team1.toLowerCase().includes('drawa') ? next.team2 : next.team1;
    reg.showNotification(`${label} ⚽`, {
      body: `Drawa vs ${opp} · ${next.date}`,
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      tag: 'drawa-match',
    });
    localStorage.setItem('drawa_notif_shown', today);
  }
}

export default function NotificationPrompt() {
  const [state, setState] = useState('idle'); // idle | prompt | granted | denied | dismissed

  useEffect(() => {
    if (!('Notification' in window)) { setState('unsupported'); return; }
    const dismissed = localStorage.getItem('drawa_notif_dismissed');
    if (dismissed) { setState('dismissed'); return; }
    if (Notification.permission === 'granted') {
      setState('granted');
      maybeNotify();
      return;
    }
    if (Notification.permission === 'denied') { setState('denied'); return; }
    // Show prompt after 4 seconds
    const t = setTimeout(() => setState('prompt'), 4000);
    return () => clearTimeout(t);
  }, []);

  const enable = async () => {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setState('granted');
      maybeNotify();
    } else {
      setState('denied');
    }
  };

  const dismiss = () => {
    localStorage.setItem('drawa_notif_dismissed', '1');
    setState('dismissed');
  };

  if (state !== 'prompt') return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: 16,
        zIndex: 98,
        background: '#0f172a',
        border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: 14,
        padding: '14px 16px',
        maxWidth: 260,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Close */}
      <button
        onClick={dismiss}
        style={{
          position: 'absolute', top: 8, right: 10,
          background: 'none', border: 'none', color: '#475569',
          cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 2,
        }}
      >
        ✕
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>
          🔔
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3 }}>
            Powiadomienia o meczach
          </div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
            Dostaniesz alert przed każdym meczem
          </div>
        </div>
      </div>

      <button
        onClick={enable}
        style={{
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          border: 'none',
          borderRadius: 8,
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          padding: '8px 0',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        WŁĄCZ POWIADOMIENIA
      </button>
    </div>
  );
}
