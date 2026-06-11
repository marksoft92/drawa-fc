import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const logoPath = join(publicDir, 'logo.png');

async function genIcon(size, outFile) {
  const padding = Math.round(size * 0.12);
  const logoSize = size - padding * 2;

  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 3, g: 7, b: 18, alpha: 255 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(join(publicDir, outFile));

  console.log(`✓ ${outFile} (${size}x${size})`);
}

await genIcon(192, 'android-chrome-192x192.png');
await genIcon(512, 'android-chrome-512x512.png');
await genIcon(180, 'apple-touch-icon.png');
console.log('Ikony wygenerowane.');
