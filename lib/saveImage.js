import sharp from "sharp";
import { writeFile } from "fs/promises";
import { join } from "path";

const UPLOADS_DIR = join(process.cwd(), "public", "uploads");

export async function saveImage(bytes, prefix = "img") {
  const buf = Buffer.from(bytes);
  const webpBuf = await sharp(buf).webp({ quality: 82 }).toBuffer();
  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
  await writeFile(join(UPLOADS_DIR, filename), webpBuf);
  return `/uploads/${filename}`;
}

export async function saveImageTo(bytes, dir, filename) {
  const buf = Buffer.from(bytes);
  const webpBuf = await sharp(buf).webp({ quality: 82 }).toBuffer();
  const name = filename.replace(/\.\w+$/, ".webp");
  await writeFile(join(process.cwd(), "public", dir, name), webpBuf);
  return `/${dir}/${name}`;
}

export function isConvertible(mime) {
  return ["image/jpeg", "image/png", "image/webp"].includes(mime);
}
