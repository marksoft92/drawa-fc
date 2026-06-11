'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { zawodnicy } from '@/lib/kadra';
import { generatePlayerCard } from '@/lib/playerCard';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const maxGole = Math.max(...zawodnicy.map(z => z.gole ?? 0), 1);
const maxAsysty = Math.max(...zawodnicy.map(z => z.asysty ?? 0), 1);
const maxMecze = Math.max(...zawodnicy.map(z => z.mecze ?? 0), 1);
const maxGM = Math.max(...zawodnicy.map(z => z.mecze > 0 ? z.gole / z.mecze : 0), 0.01);
const maxKartki = Math.max(...zawodnicy.map(z => (z.zolte ?? 0) + (z.czerwone ?? 0) * 3), 1);

function playerRadarData(z) {
  const gm = z.mecze > 0 ? z.gole / z.mecze : 0;
  const kartki = (z.zolte ?? 0) + (z.czerwone ?? 0) * 3;
  return [
    { attr: 'GOLE', val: Math.round((z.gole ?? 0) / maxGole * 100) },
    { attr: 'ASYSTY', val: Math.round((z.asysty ?? 0) / maxAsysty * 100) },
    { attr: 'MECZE', val: Math.round((z.mecze ?? 0) / maxMecze * 100) },
    { attr: 'G/M', val: Math.round(gm / maxGM * 100) },
    { attr: 'DYSC', val: Math.round((1 - kartki / maxKartki) * 100) },
  ];
}

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

const POZYCJE = ['Bramkarz', 'Obrońca', 'Pomocnik', 'Napastnik'];

function initials(imieNazwisko) {
  return imieNazwisko
    .split(' ')
    .map((w) => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* ─── Karta desktop (z efektem rozmycia rzędu) ─── */
function PlayerCard({ z, isHovered, isInRow, onEnter, onLeave, cardRef }) {
  const parts = z.imieNazwisko.split(' ');
  const nazwisko = parts[0];
  const imie = parts.slice(1).join(' ');
  const goleNaMecz = z.mecze > 0 ? (z.gole / z.mecze).toFixed(2) : '—';
  const expanded = isHovered || isInRow;

  return (
    <div
      ref={cardRef}
      className="player-card"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        background: isHovered ? '#0f1f3d' : '#0f172a',
        border: `1px solid ${isHovered ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: isHovered ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
    >
      <div style={{ height: expanded ? 300 : 0, transition: 'height 0.3s ease', overflow: 'hidden', position: 'relative', background: '#060d1c' }}>
        {expanded && z.foto ? (
          <Image
            src={z.foto}
            alt={z.imieNazwisko}
            fill
            priority={false}
            style={{
              objectFit: 'cover',
              objectPosition: 'top',
              filter: isInRow && !isHovered ? 'blur(3px) brightness(0.25)' : 'none',
              transition: 'filter 0.2s ease',
            }}
          />
        ) : expanded ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, fontWeight: 700, color: 'rgba(59,130,246,0.15)', fontFamily: "'Bebas Neue', Impact, sans-serif", filter: isInRow && !isHovered ? 'blur(3px) brightness(0.25)' : 'none', transition: 'filter 0.2s ease' }}>
            {initials(z.imieNazwisko)}
          </div>
        ) : null}
      </div>

      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {!isHovered && (
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#3b82f6', flexShrink: 0 }}>
            {initials(z.imieNazwisko)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{imie}</div>
          <div style={{ fontSize: 11, color: '#475569' }}>{nazwisko}</div>
        </div>
        {z.pozycja && (
          <div style={{ fontSize: 9, color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>{z.pozycja}</div>
        )}
      </div>

      <div style={{ height: isHovered ? 198 : 0, transition: 'height 0.35s ease', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0 8px', gap: 0 }}>
          {/* Radar chart */}
          <div style={{ width: 120, flexShrink: 0 }}>
            <ResponsiveContainer width={120} height={150}>
              <RadarChart data={playerRadarData(z)} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="attr" tick={{ fill: '#334155', fontSize: 7 }} />
                <Radar dataKey="val" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* Stats */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', alignContent: 'center', gap: 4, padding: '8px 6px 8px 0' }}>
            {[
              { v: z.mecze, l: 'MECZE' },
              { v: z.gole, l: 'GOLE' },
              { v: z.asysty, l: 'ASYSTY' },
              { v: z.mecze > 0 ? (z.gole / z.mecze).toFixed(2) : '—', l: 'G/M' },
              { v: z.zolte > 0 || z.czerwone > 0 ? `${z.zolte ?? 0}🟨${z.czerwone > 0 ? z.czerwone+'🟥' : ''}` : '—', l: 'KARTKI' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center', padding: '4px 0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 7, color: '#334155', letterSpacing: '0.07em', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Share button stays below */}
        {isHovered && (
          <div style={{ padding: '0 14px 10px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); sharePlayer(z); }}
              style={{ width: '100%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, color: '#3b82f6', fontSize: 10, letterSpacing: '0.12em', padding: '6px 0', cursor: 'pointer', fontWeight: 600 }}
            >
              UDOSTĘPNIJ KARTĘ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Karta mobile (lokalne rozwinięcie przez klik) ─── */
function MobilePlayerCard({ z, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const parts = z.imieNazwisko.split(' ');
  const nazwisko = parts[0];
  const imie = parts.slice(1).join(' ');
  const goleNaMecz = z.mecze > 0 ? (z.gole / z.mecze).toFixed(2) : '—';

  return (
    <div
      onClick={() => setExpanded((e) => !e)}
      style={{
        background: expanded ? '#0f1f3d' : '#0f172a',
        border: `1px solid ${expanded ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: expanded ? '0 8px 28px rgba(0,0,0,0.45)' : 'none',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
    >
      <div style={{ height: expanded ? 300 : 0, transition: 'height 0.3s ease', overflow: 'hidden', position: 'relative', background: '#060d1c' }}>
        {expanded && z.foto && (
          <Image src={z.foto} alt={z.imieNazwisko} fill priority={false} style={{ objectFit: 'cover', objectPosition: 'top' }} />
        )}
      </div>

      <div style={{ padding: '10px 12px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {!expanded && (
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#3b82f6', flexShrink: 0 }}>
            {initials(z.imieNazwisko)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{imie}</div>
          <div style={{ fontSize: 10, color: '#475569' }}>{nazwisko}</div>
        </div>
      </div>

      <div style={{ height: expanded ? 290 : 0, transition: 'height 0.3s ease', overflow: 'hidden' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0 8px' }}>
          {[
            { v: z.mecze,    l: 'MECZE' },
            { v: z.gole,     l: 'GOLE' },
            { v: z.asysty,   l: 'ASYSTY' },
            { v: goleNaMecz, l: 'G/M' },
            { v: z.zolte > 0 || z.czerwone > 0 ? `${z.zolte > 0 ? z.zolte + '🟨' : ''}${z.czerwone > 0 ? z.czerwone + '🟥' : ''}` : '—', l: 'KARTKI' },
          ].map(({ v, l }) => (
            <div key={l} style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 7, color: '#334155', letterSpacing: '0.07em', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Radar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0 8px' }}>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={playerRadarData(z)} margin={{ top: 12, right: 20, bottom: 12, left: 20 }}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="attr" tick={{ fill: '#475569', fontSize: 8 }} />
              <Radar dataKey="val" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {expanded && (
          <div style={{ padding: '0 12px 10px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); sharePlayer(z); }}
              style={{
                width: '100%',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 6,
                color: '#3b82f6',
                fontSize: 10,
                letterSpacing: '0.12em',
                padding: '6px 0',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              UDOSTĘPNIJ KARTĘ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sekcja pozycji (accordion mobile) ─── */
function PositionSection({ pozycja }) {
  const [open, setOpen] = useState(false);
  const players = zawodnicy.filter((z) => z.pozycja === pozycja);
  if (players.length === 0) return null;

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 0',
          background: 'transparent',
          border: 'none',
          color: '#e2e8f0',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: open ? '#3b82f6' : '#e2e8f0', transition: 'color 0.2s' }}>
          {pozycja}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#475569' }}>{players.length}</span>
          <span style={{ fontSize: 10, color: '#475569', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
        </span>
      </button>

      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, paddingBottom: 16 }}>
          {players.map((z, i) => (
            <MobilePlayerCard key={z.imieNazwisko} z={z} defaultExpanded={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Główny komponent ─── */
export default function Kadra({ SectionLabel }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [rowIds, setRowIds] = useState([]);
  const cardRefs = useRef({});

  const handleEnter = useCallback((id) => {
    setHoveredId(id);
    const el = cardRefs.current[id];
    if (!el) return;
    const top = el.offsetTop;
    const same = zawodnicy
      .filter((z) => cardRefs.current[z.imieNazwisko]?.offsetTop === top && z.imieNazwisko !== id)
      .map((z) => z.imieNazwisko);
    setRowIds(same);
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredId(null);
    setRowIds([]);
  }, []);

  return (
    <section className="mob-pb" style={{ padding: '0 20px 80px', background: '#030712' }}>
      <style>{`
        .kadra-mobile { display: none; }
        .kadra-desktop { display: grid; }
        @media (max-width: 640px) {
          .kadra-mobile { display: block; }
          .kadra-desktop { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>Kadra</SectionLabel>
        <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
          Sezon 2025/26 · {zawodnicy.length} zawodników
        </div>

        {/* Mobile — accordion po pozycji */}
        <div className="kadra-mobile" style={{ marginTop: 24 }}>
          {POZYCJE.map((p) => (
            <PositionSection key={p} pozycja={p} />
          ))}
        </div>

        {/* Desktop — siatka ze wszystkimi kartami */}
        <div
          className="kadra-desktop"
          style={{
            marginTop: 24,
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 8,
          }}
        >
          {zawodnicy.map((z) => (
            <PlayerCard
              key={z.imieNazwisko}
              z={z}
              isHovered={hoveredId === z.imieNazwisko}
              isInRow={rowIds.includes(z.imieNazwisko)}
              onEnter={() => handleEnter(z.imieNazwisko)}
              onLeave={handleLeave}
              cardRef={(el) => { cardRefs.current[z.imieNazwisko] = el; }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
