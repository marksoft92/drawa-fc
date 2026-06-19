"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { generatePlayerCard } from "@/lib/playerCard";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { computeMaxes, playerRadarData } from "@/components/kadra";

const POZ_COLORS = {
  'Bramkarz': '#f59e0b',
  'Obrońca': '#22c55e',
  'Pomocnik': '#3b82f6',
  'Napastnik': '#ef4444',
  'Trener': '#8b5cf6',
};

export default function PlayerProfileClient({ player, sezon, seasonHistory, allPlayers }) {
  const [sharing, setSharing] = useState(false);

  const z = player;
  const parts = z.imieNazwisko.split(' ');
  const imie = parts[0];
  const nazwisko = parts.slice(1).join(' ') || parts[0];
  const pozColor = POZ_COLORS[z.pozycja] || '#3b82f6';

  const maxes = computeMaxes(allPlayers);
  const radarData = playerRadarData(z, maxes);

  const totalGole = seasonHistory.reduce((s, h) => s + h.gole, 0);
  const totalMecze = seasonHistory.reduce((s, h) => s + h.mecze, 0);
  const totalAsysty = seasonHistory.reduce((s, h) => s + h.asysty, 0);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await generatePlayerCard(z);
      const safeName = z.imieNazwisko.replace(/\s+/g, '-').toLowerCase();
      const file = new File([blob], `drawa-${safeName}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `${z.imieNazwisko} — MKS Drawa`, files: [file] });
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
    setSharing(false);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 80px' }}>
      <style>{`
        .profile-hero { display: flex; gap: 40px; align-items: flex-start; }
        .profile-photo { width: 280px; flex-shrink: 0; }
        .profile-info { flex: 1; min-width: 0; }
        @media (max-width: 640px) {
          .profile-hero { flex-direction: column; gap: 0; }
          .profile-photo { width: 100%; }
          .profile-info { width: 100%; }
        }
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        @media (max-width: 480px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      {/* Hero */}
      <div className="profile-hero" style={{ paddingTop: 40 }}>
        <div className="profile-photo">
          <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 14, overflow: 'hidden', background: '#060d1c', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Image
              src={z.foto || '/kadra/noname.png'}
              alt={z.imieNazwisko}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 280px"
              style={{ objectFit: 'cover', objectPosition: 'top' }}
            />
            {z.numer && (
              <div style={{ position: 'absolute', top: 14, right: 16, fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 48, color: 'rgba(255,255,255,0.12)', lineHeight: 1 }}>
                #{z.numer}
              </div>
            )}
          </div>
        </div>

        <div className="profile-info" style={{ paddingTop: 16 }}>
          <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: pozColor, background: `${pozColor}18`, padding: '3px 10px', borderRadius: 4, marginBottom: 12 }}>
            {(z.pozycja || 'ZAWODNIK').toUpperCase()}
          </div>

          <h1 style={{ margin: 0, fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(32px, 6vw, 52px)', letterSpacing: '0.06em', color: '#fff', lineHeight: 1.1 }}>
            {imie}
            <span style={{ display: 'block', color: '#3b82f6', fontSize: 'clamp(20px, 4vw, 32px)', letterSpacing: '0.15em' }}>{nazwisko}</span>
          </h1>

          {sezon && (
            <div style={{ fontSize: 11, color: '#334155', marginTop: 12, letterSpacing: '0.1em' }}>
              SEZON {sezon}
            </div>
          )}

          {/* Main stats */}
          <div className="stat-grid" style={{ marginTop: 20 }}>
            {[
              { v: z.mecze, l: 'MECZE', color: '#fff' },
              { v: z.gole, l: 'GOLE', color: '#3b82f6' },
              { v: z.asysty, l: 'ASYSTY', color: '#22c55e' },
              { v: z.mecze > 0 ? (z.gole / z.mecze).toFixed(2) : '—', l: 'GOLE/MECZ', color: '#f59e0b' },
            ].map(({ v, l, color }) => (
              <div key={l} style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 28, color, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 8, color: '#334155', letterSpacing: '0.1em', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Extra stats row */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            {z.zolte > 0 && (
              <div style={{ fontSize: 12, color: '#475569' }}>
                <span style={{ color: '#eab308' }}>🟨 {z.zolte}</span>
              </div>
            )}
            {z.czerwone > 0 && (
              <div style={{ fontSize: 12, color: '#475569' }}>
                <span style={{ color: '#ef4444' }}>🟥 {z.czerwone}</span>
              </div>
            )}
            {(z.meczePuchar > 0 || z.golePuchar > 0) && (
              <div style={{ fontSize: 12, color: '#475569' }}>
                Puchar: {z.meczePuchar} meczów, {z.golePuchar} goli
              </div>
            )}
          </div>

          <button
            onClick={handleShare}
            disabled={sharing}
            style={{
              marginTop: 20, padding: '10px 28px', borderRadius: 8,
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
              color: '#3b82f6', fontSize: 11, letterSpacing: '0.12em', fontWeight: 600,
              cursor: sharing ? 'default' : 'pointer',
            }}
          >
            {sharing ? 'GENERUJĘ…' : 'UDOSTĘPNIJ KARTĘ ZAWODNIKA'}
          </button>
        </div>
      </div>

      {/* Radar chart */}
      <div style={{ display: 'flex', gap: 20, marginTop: 40, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#475569', textAlign: 'center', marginBottom: 8 }}>PROFIL ZAWODNIKA</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="attr" tick={{ fill: '#475569', fontSize: 10 }} />
              <Radar dataKey="val" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: '#334155', textAlign: 'center', marginTop: 4 }}>
            Wartości względne — 100% = najlepszy w drużynie
          </div>
        </div>

        {/* Season history */}
        {seasonHistory.length > 0 && (
          <div style={{ flex: '1 1 300px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#475569', marginBottom: 16 }}>
              {seasonHistory.length > 1 ? 'HISTORIA SEZONÓW' : 'SEZON'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {seasonHistory.map((h, i) => (
                <div key={h.sezon} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: i === seasonHistory.length - 1 ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)', borderRadius: 8, border: i === seasonHistory.length - 1 ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', minWidth: 60 }}>{h.sezon}</div>
                  <div style={{ display: 'flex', gap: 14, flex: 1, flexWrap: 'wrap' }}>
                    {[
                      { v: h.mecze, l: 'M', color: '#94a3b8' },
                      { v: h.gole, l: 'G', color: '#3b82f6' },
                      { v: h.asysty, l: 'A', color: '#22c55e' },
                    ].map(({ v, l, color }) => (
                      <div key={l} style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color }}>{v}</span>
                        <span style={{ fontSize: 9, color: '#334155', marginLeft: 2 }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {seasonHistory.length > 1 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 20 }}>
                {[
                  { v: totalMecze, l: 'ŁĄCZNIE MECZÓW' },
                  { v: totalGole, l: 'ŁĄCZNIE GOLI' },
                  { v: totalAsysty, l: 'ŁĄCZNIE ASYST' },
                ].map(({ v, l }) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Bebas Neue', Impact, sans-serif", color: '#fff' }}>{v}</div>
                    <div style={{ fontSize: 7, color: '#334155', letterSpacing: '0.1em' }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back link */}
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/kadra" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 24px', borderRadius: 8,
          border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6',
          fontSize: 12, letterSpacing: '0.12em', textDecoration: 'none', fontWeight: 600,
        }}>
          ← CAŁA KADRA
        </Link>
      </div>
    </div>
  );
}
