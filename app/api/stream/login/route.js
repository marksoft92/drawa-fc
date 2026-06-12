import { cookies } from 'next/headers';

export async function POST(request) {
  const { login, password } = await request.json();

  const validLogin = process.env.STREAM_ADMIN_LOGIN;
  const validPassword = process.env.STREAM_ADMIN_PASSWORD;

  if (login !== validLogin || password !== validPassword) {
    return Response.json({ error: 'Nieprawidłowe dane logowania' }, { status: 401 });
  }

  const token = Buffer.from(`${login}:${password}`).toString('base64');
  const cookieStore = await cookies();
  cookieStore.set('stream_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return Response.json({ ok: true });
}
