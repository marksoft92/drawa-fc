import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const logoData = readFileSync(join(process.cwd(), 'public', 'logo.png'));
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;

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
        {/* Background glow */}
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

        {/* Logo + name row */}
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

        {/* Divider */}
        <div style={{
          width: 80,
          height: 3,
          background: '#3b82f6',
          marginTop: 32,
          marginBottom: 32,
          borderRadius: 2,
          display: 'flex',
        }} />

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 56, alignItems: 'center' }}>
          {[
            { v: '#1', l: 'MIEJSCE' },
            { v: '52', l: 'PUNKTÓW' },
            { v: '85', l: 'GOLI' },
            { v: '21', l: 'MECZÓW' },
          ].map(({ v, l }) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#3b82f6', lineHeight: 1, display: 'flex' }}>{v}</div>
              <div style={{ fontSize: 12, color: '#475569', letterSpacing: '0.2em', display: 'flex' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          fontSize: 15,
          color: '#1e293b',
          letterSpacing: '0.15em',
          display: 'flex',
        }}>
          mksdrawadrawno.pl · Klasa B Zachodniopomorska · Sezon 2025/26
        </div>
      </div>
    ),
    { ...size }
  );
}
