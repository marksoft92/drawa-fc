import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logoData = readFileSync(join(process.cwd(), 'public', 'logo.png'));
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;

  const ustawienia = await prisma.ustawienie.findMany();
  const ust = Object.fromEntries(ustawienia.map((r) => [r.klucz, r.wartosc]));
  const sezonNazwa = ust.aktywny_sezon || '2025/26';

  const tabela = await prisma.tabelaDruzyna.findMany({
    where: { sezon: sezonNazwa },
    orderBy: { pozycja: 'asc' },
  });

  const drawaRow = tabela.find((r) => r.nazwa?.toLowerCase().includes('drawa'));

  const liga = ust.aktywna_liga || 'A klasa Zachodniopomorska';
  const stats = [
    { v: drawaRow ? `#${drawaRow.pozycja}` : '#-', l: 'MIEJSCE' },
    { v: String(drawaRow?.pkt ?? 0), l: 'PUNKTÓW' },
    { v: String(drawaRow?.bramkiZd ?? 0), l: 'GOLI' },
    { v: String(drawaRow?.mecze ?? 0), l: 'MECZÓW' },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#030712',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="MKS Drawa"
            width={140}
            height={140}
            style={{ objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              fontSize: 88,
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '0.06em',
              lineHeight: 1,
              display: 'flex',
            }}>
              MKS DRAWA
            </div>
            <div style={{
              fontSize: 28,
              color: '#3b82f6',
              letterSpacing: '0.45em',
              marginTop: 6,
              display: 'flex',
            }}>
              DRAWNO
            </div>
          </div>
        </div>

        <div style={{
          width: 80,
          height: 3,
          background: '#3b82f6',
          marginTop: 32,
          marginBottom: 32,
          borderRadius: 2,
          display: 'flex',
        }} />

        <div style={{ display: 'flex', gap: 56, alignItems: 'center' }}>
          {stats.map(({ v, l }) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#3b82f6', lineHeight: 1, display: 'flex' }}>{v}</div>
              <div style={{ fontSize: 12, color: '#475569', letterSpacing: '0.2em', display: 'flex' }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{
          position: 'absolute',
          bottom: 32,
          fontSize: 15,
          color: '#1e293b',
          letterSpacing: '0.15em',
          display: 'flex',
        }}>
          mksdrawadrawno.pl · {liga} · Sezon {sezonNazwa}
        </div>
      </div>
    ),
    { ...size }
  );
}
