import { ImageResponse } from 'next/og';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { isDrawa } from '@/lib/ligaUtils';

export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function toDataUri(relPath) {
  if (!relPath) return null;
  const file = join(process.cwd(), 'public', relPath.replace(/^\//, ''));
  if (!existsSync(file)) return null;
  const ext = relPath.split('.').pop().toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
}

function Crest({ src, size: s }) {
  return src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={src} alt="" width={s} height={s} style={{ objectFit: 'contain' }} />
    : <div style={{ width: s, height: s, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex' }} />;
}

export default async function Image({ params }) {
  const { id } = await params;
  const m = await prisma.mecz.findUnique({ where: { id } });
  if (!m) return new Response('Not found', { status: 404 });

  const drawa1 = isDrawa(m.team1);
  const drawa2 = isDrawa(m.team2);
  const logo1 = toDataUri(drawa1 ? '/logo.png' : m.herb1);
  const logo2 = toDataUri(drawa2 ? '/logo.png' : m.herb2);

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', background: '#030712',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        fontFamily: 'sans-serif', position: 'relative', padding: '60px 80px',
      }}>
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, #3b82f618 0%, transparent 70%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex',
        }} />

        <div style={{ fontSize: 16, color: '#475569', letterSpacing: '0.25em', marginBottom: 28, display: 'flex' }}>
          {(m.liga || 'MECZ').toUpperCase()}{m.sezon ? ` · ${m.sezon}` : ''}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 64 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: 320 }}>
            <Crest src={logo1} size={96} />
            <div style={{ fontSize: 26, fontWeight: 700, color: drawa1 ? '#3b82f6' : '#e2e8f0', textAlign: 'center', display: 'flex' }}>{m.team1}</div>
          </div>

          <div style={{ fontSize: 96, fontWeight: 900, color: '#fff', letterSpacing: '0.04em', display: 'flex' }}>
            {m.score || '—:—'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: 320 }}>
            <Crest src={logo2} size={96} />
            <div style={{ fontSize: 26, fontWeight: 700, color: drawa2 ? '#3b82f6' : '#e2e8f0', textAlign: 'center', display: 'flex' }}>{m.team2}</div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 2, background: '#3b82f6', borderRadius: 1, display: 'flex' }} />
          <div style={{ fontSize: 14, color: '#475569', letterSpacing: '0.1em', display: 'flex' }}>mksdrawadrawno.pl</div>
          <div style={{ width: 40, height: 2, background: '#3b82f6', borderRadius: 1, display: 'flex' }} />
          {m.date && <div style={{ fontSize: 14, color: '#334155', display: 'flex' }}>{m.date}</div>}
        </div>
      </div>
    ),
    { ...size }
  );
}
