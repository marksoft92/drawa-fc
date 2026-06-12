import { cookies } from 'next/headers';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const dataFile = join(process.cwd(), 'stream-data.json');

function readStreamData() {
  try {
    return JSON.parse(readFileSync(dataFile, 'utf8'));
  } catch {
    return { url: '' };
  }
}

function isAuthed(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [login, password] = decoded.split(':');
    return login === process.env.STREAM_ADMIN_LOGIN && password === process.env.STREAM_ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

export async function GET() {
  const data = readStreamData();
  return Response.json({ url: data.url || '' });
}

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('stream_session')?.value;

  if (!isAuthed(token)) {
    return Response.json({ error: 'Brak dostępu' }, { status: 401 });
  }

  const { url } = await request.json();
  writeFileSync(dataFile, JSON.stringify({ url: url ?? '' }), 'utf8');
  return Response.json({ ok: true });
}
