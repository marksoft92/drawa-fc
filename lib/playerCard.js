// player shape: { imieNazwisko, pozycja, mecze, gole, asysty, zolte, czerwone }

export function generatePlayerCard(player) {
  return new Promise((resolve) => {
    const W = 400, H = 580;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg;
    ctx.beginPath();
    roundRect(ctx, 0, 0, W, H, 20);
    ctx.fill();

    // Top accent bar (blue gradient)
    const accent = ctx.createLinearGradient(0, 0, W, 0);
    accent.addColorStop(0, '#1d4ed8');
    accent.addColorStop(1, '#3b82f6');
    ctx.fillStyle = accent;
    ctx.beginPath();
    roundRect(ctx, 0, 0, W, 6, [20, 20, 0, 0]);
    ctx.fill();

    // Initials circle
    const cx = W / 2, cy = 118;
    ctx.beginPath();
    ctx.arc(cx, cy, 62, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(59,130,246,0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(59,130,246,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Initials text
    const parts = player.imieNazwisko.split(' ');
    const initials = parts.map(p => p[0] || '').join('').slice(0, 2).toUpperCase();
    ctx.font = "bold 44px 'Bebas Neue', Impact, sans-serif";
    ctx.fillStyle = '#3b82f6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, cx, cy);

    // Name
    const lastName = parts[0] || '';
    const firstName = parts.slice(1).join(' ');
    ctx.textBaseline = 'alphabetic';

    ctx.font = "600 12px -apple-system, Arial, sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText(firstName.toUpperCase(), W / 2, 210);

    ctx.font = "bold 38px 'Bebas Neue', Impact, sans-serif";
    ctx.fillStyle = '#ffffff';
    ctx.fillText(lastName.toUpperCase(), W / 2, 248);

    // Position badge
    if (player.pozycja) {
      const label = player.pozycja.toUpperCase();
      ctx.font = "bold 10px -apple-system, Arial, sans-serif";
      const tw = ctx.measureText(label).width;
      const bw = tw + 28, bh = 22;
      const bx = W / 2 - bw / 2, by = 258;
      ctx.fillStyle = 'rgba(59,130,246,0.1)';
      ctx.beginPath();
      roundRect(ctx, bx, by, bw, bh, 11);
      ctx.fill();
      ctx.strokeStyle = 'rgba(59,130,246,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#3b82f6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, W / 2, by + bh / 2);
    }

    // Divider
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(32, 302, W - 64, 1);

    // Stats (3 columns)
    const stats = [
      { v: player.gole, l: 'GOLE' },
      { v: player.asysty, l: 'ASYSTY' },
      { v: player.mecze, l: 'MECZE' },
    ];
    const colW = (W - 64) / 3;
    stats.forEach(({ v, l }, i) => {
      const x = 32 + colW * i + colW / 2;
      ctx.font = "bold 40px 'Bebas Neue', Impact, sans-serif";
      ctx.fillStyle = '#3b82f6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(String(v ?? 0), x, 362);
      ctx.font = "bold 9px -apple-system, Arial, sans-serif";
      ctx.fillStyle = '#475569';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(l, x, 378);
      if (i < 2) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(32 + colW * (i + 1), 322, 1, 64);
      }
    });

    // Divider 2
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(32, 404, W - 64, 1);

    // Load logo then finish
    const logo = new Image();
    logo.crossOrigin = 'anonymous';

    const drawBottom = () => {
      ctx.font = "bold 15px 'Bebas Neue', Impact, sans-serif";
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('MKS DRAWA DRAWNO', W / 2, 498);
      ctx.font = "10px -apple-system, Arial, sans-serif";
      ctx.fillStyle = '#334155';
      ctx.fillText('mksdrawadrawno.pl · Sezon 2025/26', W / 2, 516);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    };

    logo.onload = () => {
      ctx.drawImage(logo, W / 2 - 26, 424, 52, 52);
      drawBottom();
    };
    logo.onerror = drawBottom;
    logo.src = '/logo.png';
  });
}

// Helper: manual roundRect for compat
function roundRect(ctx, x, y, w, h, r) {
  const radii = Array.isArray(r) ? r : [r, r, r, r];
  const [tl, tr, br, bl] = radii;
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}
