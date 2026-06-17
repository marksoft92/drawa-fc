import { NextResponse } from "next/server";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("player_session");

  if (pathname.startsWith("/api/admin") && !hasSession) {
    return Response.json({ error: "Brak dostępu" }, { status: 401 });
  }

  if (pathname.startsWith("/api/panel") && !pathname.startsWith("/api/panel/push") && !hasSession) {
    return Response.json({ error: "Brak dostępu" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*", "/api/panel/:path*"],
};
