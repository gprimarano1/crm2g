import { type NextRequest, NextResponse } from "next/server";

// Middleware mínimo: apenas injeta o pathname como header.
// Auth é verificada nos layouts de cada route group (server components).
// @supabase/ssr não é usado aqui pois o Edge Runtime da Hostinger
// não suporta essa dependência e causa crash na inicialização.
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
