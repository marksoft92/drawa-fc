'use client';

const sponsorzy = [
  { nazwa: 'Gmina Drawno', logo: '/sponsorzy/gmina.jpg',href: 'https://www.facebook.com/GminaDrawno' },
  { nazwa: 'Stalumo', logo: '/sponsorzy/stal.jpg' ,href: 'https://www.facebook.com/profile.php?id=61563758556441'},
  { nazwa: 'Goodvalley', logo: '/sponsorzy/gv.jpg',href: 'https://www.facebook.com/GoodvalleyPL' },
  { nazwa: 'homebee.pl', logo: '/sponsorzy/hb.jpg',href: 'https://www.facebook.com/profile.php?id=100094025337228' },
  { nazwa: 'Centrum Finansowe Drawno', logo: '/sponsorzy/cf.jpg',href: 'https://www.facebook.com/cfdrawno' },
  { nazwa: 'Pogotowie Kajakowe Novak', logo: '/sponsorzy/pkn.jpg' ,href: 'https://www.facebook.com/PKNowak'},
  { nazwa: 'Kajaki Pole namiotowe Paintball Drawno', logo: '/sponsorzy/emilex-drawno-logo.png' ,href: 'https://www.facebook.com/polenamiotoweemilex'},
  { nazwa: 'Krzysztof Farbotko Ubezpieczenia', logo: '/sponsorzy/farbo.jpg' ,href: 'https://www.facebook.com/profile.php?id=61567532552948'},
  { nazwa: 'Zachodniopomorski Bank Spółdzielczy', logo: '/sponsorzy/sgb.jpg' ,href: 'https://www.facebook.com/profile.php?id=100057141352732'},
  { nazwa: 'Firma Dren z Recza – Maciej, Michał i Roman Kwaśnik', logo: '/sponsorzy/dren.svg' ,href: 'https://dren.com.pl/'},
  { nazwa: 'WiToBi – Patryk Krykwiński', logo: '/sponsorzy/noname.jpg',href: 'https://www.multigeodeta.pl/firma/witobi-uslugi-geodezyjne-patryk-krykwinski-8918176#' },
  { nazwa: 'Wiśniowski-Instal', logo: '/sponsorzy/wisn.webp',href: 'https://www.google.com/search?sca_esv=ec0135bcbec233e7&sxsrf=ANbL-n6yyUoMyKPflCPLU2QatdS4T1bPcA:1780947047931&q=Wi%C5%9Bniowski-Instal&si=AL3DRZGNtcdgKOqVhotcr-UG2kkYpwR2WO4qu3O00NmpwBmLneVmmSeLh_hN54pSjAkSFpQU6a5CWj16A2IrvP5v7-SbKwuRxBv-s6LbbsmW8wlzLMjsqeE7sWKvwNApgQkw-5maPgcW&sa=X&ved=2ahUKEwiek5_hsPiUAxUbFBAIHQvDCsQQ_coHegQINBAB&biw=1920&bih=992&dpr=1#lpg=ik:CAoSF0NJSE0wb2dLRUlDQWdJRHBzcExRc3dF' },
  { nazwa: 'Małgorzata Łubińska', logo: '/sponsorzy/noname.jpg',href: 'https://www.facebook.com/irazone' },
  { nazwa: 'Krzysztof Gralla', logo: '/sponsorzy/noname.jpg',href: '' },
];

const css = `
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .marquee-track {
    display: flex;
    width: max-content;
    animation: marquee 30s linear infinite;
  }
  .marquee-track:hover {
    animation-play-state: paused;
  }
  .sponsor-item {
    display: flex;
    align-items: center;
    gap: 20;
    padding: 0 32px;
    border-right: 1px solid rgba(255,255,255,0.06);
    white-space: nowrap;
    flex-shrink: 0;
    text-decoration: none;
    border-radius: 8px;
    transition: background 0.2s;
  }
  .sponsor-item:hover {
    background: rgba(255,255,255,0.05);
  }
  .sponsor-item:hover img {
    opacity: 1;
  }
  .sponsor-item:hover .sponsor-name {
    color: #e2e8f0;
  }
`;

function SponsorItem({ s }) {
  const Tag = s.href ? 'a' : 'div';
  const linkProps = s.href
    ? { href: s.href, target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Tag
      className="sponsor-item"
      {...linkProps}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '6px 32px',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        textDecoration: 'none',
        cursor: s.href ? 'pointer' : 'default',
      }}
    >
      {s.logo ? (
        <img
          src={s.logo}
          alt={s.nazwa}
          style={{ height: 108, maxWidth: 100, objectFit: 'contain', opacity: 0.75, transition: 'opacity 0.2s' }}
        />
      ) : (
        <div
          style={{
            width: 66,
            height: 66,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}
        />
      )}
      <span className="sponsor-name" style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em', transition: 'color 0.2s' }}>
        {s.nazwa}
      </span>
    </Tag>
  );
}

export default function Sponsorzy({ SectionLabel }) {
  const doubled = [...sponsorzy, ...sponsorzy];

  return (
    <section className="mob-pb" style={{ padding: '0 0 80px', background: '#030712' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
        <SectionLabel>Sponsorzy</SectionLabel>
        <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
          Dziękujemy naszym partnerom za wsparcie
        </div>
      </div>

      <div style={{ position: 'relative', marginTop: 24, overflow: 'hidden' }}>
        {/* fade edges */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(to right, #030712 0%, transparent 8%, transparent 92%, #030712 100%)',
        }} />

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: '#0a0f1e',
            padding: '18px 0',
            overflow: 'hidden',
          }}
        >
          <style>{css}</style>
          <div className="marquee-track">
            {doubled.map((s, i) => (
              <SponsorItem key={i} s={s} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
