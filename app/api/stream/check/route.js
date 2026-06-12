import { cookies } from 'next/headers';

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
  const cookieStore = await cookies();
  const token = cookieStore.get('stream_session')?.value;
  return Response.json({ authed: isAuthed(token) });
}
