// player shape: { imieNazwisko, pozycja, mecze, gole, asysty, foto }

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

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

export async function generatePlayerCard(player) {
  // Logical dimensions — canvas rendered at 2x for crisp display on phones
  const LW = 400, LH = 620;
  const S = 2;
  const canvas = document.createElement('canvas');
  canvas.width = LW * S;
  canvas.height = LH * S;
  const ctx = canvas.getContext('2d');
  ctx.scale(S, S);

  const [photoImg, logoImg] = await Promise.all([
    loadImage(player.foto || null),
    loadImage('/logo.png'),
  ]);

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, LH);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(1, '#030712');
  ctx.fillStyle = bg;
  ctx.beginPath();
  roundRect(ctx, 0, 0, LW, LH, 20);
  ctx.fill();

  // Top accent bar
  const accent = ctx.createLinearGradient(0, 0, LW, 0);
  accent.addColorStop(0, '#1d4ed8');
  accent.addColorStop(1, '#3b82f6');
  ctx.fillStyle = accent;
  ctx.beginPath();
  roundRect(ctx, 0, 0, LW, 6, [20, 20, 0, 0]);
  ctx.fill();

  // Avatar — bigger circle
  const cx = LW / 2, cy = 124, R = 90;
  const parts = player.imieNazwisko.split(' ');

  if (photoImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    // Cover-fit, anchor to top so face is visible
    const scale = Math.max((R * 2) / photoImg.naturalWidth, (R * 2) / photoImg.naturalHeight);
    const dw = photoImg.naturalWidth * scale;
    const dh = photoImg.naturalHeight * scale;
    ctx.drawImage(photoImg, cx - dw / 2, cy - R, dw, dh);
    ctx.restore();

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(59,130,246,0.55)';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(59,130,246,0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(59,130,246,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const initials = parts.map(p => p[0] || '').join('').slice(0, 2).toUpperCase();
    ctx.font = "bold 52px 'Bebas Neue', Impact, sans-serif";
    ctx.fillStyle = '#3b82f6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, cx, cy);
  }

  // Name
  const lastName = parts[0] || '';
  const firstName = parts.slice(1).join(' ');
  const nameY = cy + R + 28;

  ctx.textBaseline = 'alphabetic';
  ctx.font = "600 12px -apple-system, Arial, sans-serif";
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText(firstName.toUpperCase(), LW / 2, nameY);

  ctx.font = "bold 40px 'Bebas Neue', Impact, sans-serif";
  ctx.fillStyle = '#ffffff';
  ctx.fillText(lastName.toUpperCase(), LW / 2, nameY + 38);

  // Position badge
  const badgeY = nameY + 50;
  if (player.pozycja) {
    const label = player.pozycja.toUpperCase();
    ctx.font = "bold 10px -apple-system, Arial, sans-serif";
    const tw = ctx.measureText(label).width;
    const bw = tw + 28, bh = 22;
    const bx = LW / 2 - bw / 2;
    ctx.fillStyle = 'rgba(59,130,246,0.1)';
    ctx.beginPath();
    roundRect(ctx, bx, badgeY, bw, bh, 11);
    ctx.fill();
    ctx.strokeStyle = 'rgba(59,130,246,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#3b82f6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, LW / 2, badgeY + bh / 2);
  }

  // Divider
  const div1Y = badgeY + 34;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(32, div1Y, LW - 64, 1);

  // Stats
  const statsY = div1Y + 52;
  const stats = [
    { v: player.gole, l: 'GOLE' },
    { v: player.asysty, l: 'ASYSTY' },
    { v: player.mecze, l: 'MECZE' },
  ];
  const colW = (LW - 64) / 3;
  stats.forEach(({ v, l }, i) => {
    const x = 32 + colW * i + colW / 2;
    ctx.font = "bold 42px 'Bebas Neue', Impact, sans-serif";
    ctx.fillStyle = '#3b82f6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(v ?? 0), x, statsY);
    ctx.font = "bold 9px -apple-system, Arial, sans-serif";
    ctx.fillStyle = '#475569';
    ctx.fillText(l, x, statsY + 16);
    if (i < 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(32 + colW * (i + 1), div1Y + 12, 1, 64);
    }
  });

  // Divider 2
  const div2Y = statsY + 32;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(32, div2Y, LW - 64, 1);

  // Logo + branding
  const logoY = div2Y + 16;
  if (logoImg) {
    ctx.drawImage(logoImg, LW / 2 - 28, logoY, 56, 56);
  }
  ctx.font = "bold 15px 'Bebas Neue', Impact, sans-serif";
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('MKS DRAWA DRAWNO', LW / 2, logoY + 72);
  ctx.font = "10px -apple-system, Arial, sans-serif";
  ctx.fillStyle = '#334155';
  ctx.fillText('mksdrawadrawno.pl · Sezon 2025/26', LW / 2, logoY + 88);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
