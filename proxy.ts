import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const PROTECTED_ROUTES = ["/konto"];

function stripLocalePrefix(pathname: string): { path: string; prefix: string } {
  const match = pathname.match(/^\/(en|es)(\/.*)?$/);
  if (!match) return { path: pathname, prefix: "" };
  return { path: match[2] ?? "/", prefix: `/${match[1]}` };
}

/** Runs next-intl's locale routing first, then layers the Supabase session
 * refresh and /konto gating on top of its response, so the locale cookie (and
 * any locale redirect it issues) isn't lost. Next.js 16 renamed middleware.ts
 * to proxy.ts; this file replaces what used to be middleware. */
export default async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { path, prefix } = stripLocalePrefix(request.nextUrl.pathname);
  const isProtected = PROTECTED_ROUTES.some((route) => path.startsWith(route));
  if (isProtected && !user) {
    const redirectUrl = new URL(`${prefix}/login`, request.url);
    // Locale-unprefixed on purpose — the login Server Action re-adds the
    // current locale via the i18n-aware redirect() when it consumes this,
    // so this must not carry a prefix or it would get doubled (/en/en/konto).
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
