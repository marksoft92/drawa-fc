'use client';

import { useState, useEffect } from 'react';

const IconPin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconFacebook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IconInstagram = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.01a16 16 0 0 0 6.08 6.08l1.19-.94a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);

function buildItems(u) {
  const items = [];
  if (u.adres) items.push({ Icon: IconPin, label: 'ADRES STADIONU', main: u.adres.split(',')[0] || u.adres, sub: u.adres.split(',').slice(1).join(',').trim() || undefined, cta: 'OTWÓRZ W MAPACH →', href: u.adresLink || '#' });
  if (u.telefon) items.push({ Icon: IconPhone, label: 'TELEFON', main: u.telefon, sub: u.telefonOpis || undefined, cta: 'ZADZWOŃ →', href: `tel:${(u.telefon).replace(/\s/g, '')}` });
  if (u.emailKlub) items.push({ Icon: IconMail, label: 'E-MAIL KLUBU', main: u.emailKlub, sub: 'Oficjalny adres klubowy', cta: 'WYŚLIJ WIADOMOŚĆ →', href: `mailto:${u.emailKlub}` });
  if (u.emailPrezes) items.push({ Icon: IconMail, label: 'E-MAIL PREZESA', main: u.emailPrezes, sub: u.telefonOpis ? u.telefonOpis.replace(/Prezes[^–—]*[–—]\s*/i, '') : undefined, cta: 'WYŚLIJ WIADOMOŚĆ →', href: `mailto:${u.emailPrezes}` });
  if (u.facebook) items.push({ Icon: IconFacebook, label: 'FACEBOOK', main: 'MKS Drawa Drawno', sub: 'Obserwuj klub', cta: 'PRZEJDŹ DO PROFILU →', href: u.facebook });
  if (u.instagram) items.push({ Icon: IconInstagram, label: 'INSTAGRAM', main: 'mksdrawadrawno', sub: 'Obserwuj profil', cta: 'PRZEJDŹ DO PROFILU →', href: u.instagram });
  if (u.liga) items.push({ Icon: IconShield, label: 'LIGA', main: u.liga, sub: `Zachodniopomorskie · Sezon ${u.ligaSezon || ''}`, cta: 'Rozgrywki ZZPN →', href: u.ligaLink || '#' });
  return items;
}

export default function Kontakt({ SectionLabel }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch('/api/ustawienia')
      .then(r => r.json())
      .then(u => setItems(buildItems(u)))
      .catch(() => {});
  }, []);

  return (
    <section className="mob-pb" style={{ padding: '0 20px 80px', background: '#030712' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>Kontakt</SectionLabel>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {items.map((item, i) => (
            <a key={i} href={item.href} target="_blank" rel="noopener noreferrer"
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '24px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.background = '#0f1f3d'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.Icon />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.2em', fontWeight: 700, marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 18, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.06em', color: '#fff', lineHeight: 1.2 }}>{item.main}</div>
                {item.sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{item.sub}</div>}
              </div>
              <div style={{ fontSize: 10, color: '#3b82f6', letterSpacing: '0.12em', fontWeight: 600, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>{item.cta}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
