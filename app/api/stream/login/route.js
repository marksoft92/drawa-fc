import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { checkRateLimit } from "@/lib/rateLimit";

const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = checkRateLimit(`stream:${ip}`);
  if (limit.blocked) {
    return Response.json(
      { error: `Zbyt wiele prób logowania. Spróbuj za ${limit.retryAfter}s` },
      { status: 429 }
    );
  }

  const { login, password } = await request.json();

  if (login !== process.env.STREAM_ADMIN_LOGIN || password !== process.env.STREAM_ADMIN_PASSWORD) {
    return Response.json({ error: "Nieprawidłowe dane logowania" }, { status: 401 });
  }

  const token = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("stream_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return Response.json({ ok: true });
}
