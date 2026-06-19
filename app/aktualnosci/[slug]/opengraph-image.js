import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  const { slug } = await params;
  const a = await prisma.artykul.findUnique({ where: { slug }, select: { title: true, tags: true, date: true, kolor: true } });
  if (!a) return new Response('Not found', { status: 404 });

  const logoData = readFileSync(join(process.cwd(), 'public', 'logo.png'));
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;
  const color = a.kolor || '#3b82f6';

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', background: '#030712',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        fontFamily: 'sans-serif', position: 'relative', padding: '60px 80px',
      }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="" width={56} height={56} style={{ objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '0.06em', display: 'flex' }}>MKS DRAWA</div>
            <div style={{ fontSize: 11, color: color, letterSpacing: '0.3em', display: 'flex' }}>DRAWNO</div>
          </div>
        </div>

        {a.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {a.tags.slice(0, 3).map((tag) => (
              <div key={tag} style={{
                fontSize: 12, fontWeight: 700, letterSpacing: '0.12em',
                color, background: `${color}1a`, padding: '4px 14px', borderRadius: 6,
                display: 'flex',
              }}>
                {tag.toUpperCase()}
              </div>
            ))}
          </div>
        )}

        <div style={{
          fontSize: 44, fontWeight: 900, color: '#fff', textAlign: 'center',
          lineHeight: 1.15, maxWidth: 900, display: 'flex',
        }}>
          {a.title.length > 80 ? a.title.slice(0, 77) + '...' : a.title}
        </div>

        <div style={{
          position: 'absolute', bottom: 40, display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ width: 40, height: 2, background: color, borderRadius: 1, display: 'flex' }} />
          <div style={{ fontSize: 14, color: '#475569', letterSpacing: '0.1em', display: 'flex' }}>
            mksdrawadrawno.pl
          </div>
          <div style={{ width: 40, height: 2, background: color, borderRadius: 1, display: 'flex' }} />
          {a.date && <div style={{ fontSize: 14, color: '#334155', display: 'flex' }}>{a.date}</div>}
        </div>
      </div>
    ),
    { ...size }
  );
}
