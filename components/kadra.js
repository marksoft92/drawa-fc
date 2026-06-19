'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { generatePlayerCard } from '@/lib/playerCard';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

function slugify(name) {
  return name.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function computeMaxes(zawodnicy) {
  return {
    maxGole:   Math.max(...zawodnicy.map(z => z.gole ?? 0), 1),
    maxAsysty: Math.max(...zawodnicy.map(z => z.asysty ?? 0), 1),
    maxMecze:  Math.max(...zawodnicy.map(z => z.mecze ?? 0), 1),
    maxGM:     Math.max(...zawodnicy.map(z => z.mecze > 0 ? z.gole / z.mecze : 0), 0.01),
    maxKartki: Math.max(...zawodnicy.map(z => (z.zolte ?? 0) + (z.czerwone ?? 0) * 3), 1),
  };
}

export function playerRadarData(z, maxes) {
  const { maxGole, maxAsysty, maxMecze, maxGM, maxKartki } = maxes;
  const gm = z.mecze > 0 ? z.gole / z.mecze : 0;
  const kartki = (z.zolte ?? 0) + (z.czerwone ?? 0) * 3;
  return [
    { attr: 'GOLE',   val: Math.round((z.gole ?? 0) / maxGole * 100) },
    { attr: 'ASYSTY', val: Math.round((z.asysty ?? 0) / maxAsysty * 100) },
    { attr: 'MECZE',  val: Math.round((z.mecze ?? 0) / maxMecze * 100) },
    { attr: 'G/M',    val: Math.round(gm / maxGM * 100) },
    { attr: 'DYSC',   val: Math.round((1 - kartki / maxKartki) * 100) },
  ];
}

export { computeMaxes };

async function sharePlayer(player) {
  try {
    const blob = await generatePlayerCard(player);
    const safeName = player.imieNazwisko.replace(/\s+/g, '-').toLowerCase();
    const file = new File([blob], `drawa-${safeName}.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: `${player.imieNazwisko} — MKS Drawa`, files: [file] });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drawa-${safeName}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (e) {
    if (e?.name !== 'AbortError') console.error(e);
  }
}

const POZYCJE = ['Bramkarz', 'Obrońca', 'Pomocnik', 'Napastnik', 'Trener'];

const POZ_COLORS = {
  'Bramkarz': '#f59e0b',
  'Obrońca': '#22c55e',
  'Pomocnik': '#3b82f6',
  'Napastnik': '#ef4444',
  'Trener': '#8b5cf6',
};

function initials(imieNazwisko) {
  return imieNazwisko.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
}

function PlayerCard({ z }) {
  const [sharing, setSharing] = useState(false);
  const parts = z.imieNazwisko.split(' ');
  const nazwisko = parts[0];
  const imie = parts.slice(1).join(' ');
  const slug = slugify(z.imieNazwisko);
  const pozColor = POZ_COLORS[z.pozycja] || '#3b82f6';

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (sharing) return;
    setSharing(true);
    await sharePlayer(z);
    setSharing(false);
  };

  return (
    <Link href={`/kadra/${slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="kadra-card"
        style={{
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          overflow: 'hidden',
          transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
          cursor: 'pointer',
        }}
      >
        <div style={{ position: 'relative', aspectRatio: '3/4', background: '#060d1c' }}>
          <Image
            src={z.foto || '/kadra/noname.png'}
            alt={z.imieNazwisko}
            fill
            sizes="(max-width: 640px) 50vw, 200px"
            style={{ objectFit: 'cover', objectPosition: 'top' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(3,7,18,0.95) 100%)' }} />

          {z.numer && (
            <div style={{ position: 'absolute', top: 10, right: 12, fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 28, color: 'rgba(255,255,255,0.15)', lineHeight: 1 }}>
              {z.numer}
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 14px 12px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{imie}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{nazwisko}</div>
            {z.pozycja && (
              <div style={{ display: 'inline-block', marginTop: 6, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: pozColor, background: `${pozColor}18`, padding: '2px 8px', borderRadius: 4 }}>
                {z.pozycja.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '10px 14px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            {[
              { v: z.mecze, l: 'MECZE' },
              { v: z.gole, l: 'GOLE' },
              { v: z.asysty, l: 'ASYSTY' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Bebas Neue', Impact, sans-serif", color: '#3b82f6', lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 8, color: '#334155', letterSpacing: '0.08em', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>

          <button
            onClick={handleShare}
            disabled={sharing}
            style={{
              width: '100%', marginTop: 10,
              background: sharing ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6,
              color: sharing ? '#334155' : '#3b82f6',
              fontSize: 9, letterSpacing: '0.12em', padding: '5px 0',
              cursor: sharing ? 'default' : 'pointer', fontWeight: 600,
            }}
          >
            {sharing ? 'GENERUJĘ…' : 'UDOSTĘPNIJ KARTĘ'}
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function Kadra({ SectionLabel, kadraData, showLink }) {
  const [zawodnicy, setZawodnicy] = useState([]);
  const [sezon, setSezon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (kadraData) {
      setZawodnicy(kadraData.players ?? []);
      setSezon(kadraData.sezon);
      setLoading(false);
      return;
    }
    fetch('/api/kadra')
      .then((r) => r.json())
      .then((d) => { setZawodnicy(d.players ?? []); setSezon(d.sezon); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [kadraData]);

  const zawodnicyBezTrenera = zawodnicy.filter(z => z.pozycja !== 'Trener');
  const trenerzy = zawodnicy.filter(z => z.pozycja === 'Trener');

  return (
    <section className="mob-pb" style={{ padding: '0 20px 80px', background: '#030712' }}>
      <style>{`
        .kadra-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-color: rgba(59,130,246,0.3) !important; }
        .kadra-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
        @media (max-width: 480px) { .kadra-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>Kadra</SectionLabel>
        <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
          {sezon ? `Sezon ${sezon} · ` : ''}{zawodnicyBezTrenera.length} zawodników
        </div>

        {loading && <div style={{ marginTop: 24, color: '#334155', fontSize: 13 }}>Ładowanie kadry...</div>}

        {!loading && POZYCJE.filter(p => p !== 'Trener').map(pozycja => {
          const players = zawodnicyBezTrenera.filter(z => z.pozycja === pozycja);
          if (players.length === 0) return null;
          return (
            <div key={pozycja} style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 3, height: 16, background: POZ_COLORS[pozycja], borderRadius: 2 }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: POZ_COLORS[pozycja] }}>{pozycja.toUpperCase()}</span>
                <span style={{ fontSize: 11, color: '#334155' }}>{players.length}</span>
              </div>
              <div className="kadra-grid">
                {players.map(z => <PlayerCard key={z.id} z={z} />)}
              </div>
            </div>
          );
        })}

        {!loading && trenerzy.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 3, height: 16, background: POZ_COLORS['Trener'], borderRadius: 2 }} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: POZ_COLORS['Trener'] }}>SZTAB SZKOLENIOWY</span>
            </div>
            <div className="kadra-grid">
              {trenerzy.map(z => <PlayerCard key={z.id} z={z} />)}
            </div>
          </div>
        )}

        {showLink && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <a href="/kadra" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', fontSize: 12, letterSpacing: '0.14em', textDecoration: 'none', fontWeight: 600 }}>
              ZOBACZ PEŁNĄ KADRĘ →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
