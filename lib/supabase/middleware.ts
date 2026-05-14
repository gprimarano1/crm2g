import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Injeta pathname como header de request para que Server Components possam lê-lo via headers()
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Atualiza a sessão (não usar getSession() — usa getUser() por segurança)
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error("[middleware] getUser error:", err);
  }

  const { pathname } = request.nextUrl;

  // Rotas públicas que nunca precisam de auth
  const isPublicRoute =
    pathname.startsWith("/proposta/") ||
    pathname.startsWith("/relatorio/") ||
    pathname.startsWith("/api/webhook/") ||
    pathname === "/";

  if (isPublicRoute) return supabaseResponse;

  const isAuthRoute = pathname === "/login" || pathname.startsWith("/login");

  const isAdminRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/clientes") ||
    pathname.startsWith("/campanhas") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/propostas") ||
    pathname.startsWith("/relatorios") ||
    pathname.startsWith("/configuracoes");

  const isClienteRoute =
    pathname.startsWith("/painel") ||
    pathname === "/trocar-senha";

  // Sem sessão: bloqueia rotas protegidas
  if (!user && (isAdminRoute || isClienteRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Com sessão: redireciona /login para a área correta
  // O papel exato é verificado nos layouts (server components)
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
