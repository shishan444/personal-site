import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createNextIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createNextIntlMiddleware(routing);

const PROTECTED_PREFIXES = ["/admin"];
const AUTH_PAGES = ["/login", "/change-password"];
const LOCALE_PREFIXES = ["/zh", "/en"];

function stripLocale(pathname: string): string {
  for (const prefix of LOCALE_PREFIXES) {
    if (pathname === prefix) return "/";
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  }
  return pathname;
}

export function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const { pathname } = request.nextUrl;
  const pathWithoutLocale = stripLocale(pathname);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathWithoutLocale.startsWith(p));
  const isAuthPage = AUTH_PAGES.includes(pathWithoutLocale);
  const sessionCookie = getSessionCookie(request);

  if (isProtected && !sessionCookie) {
    const url = new URL(`/${routing.defaultLocale}/login`, request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && sessionCookie && pathWithoutLocale !== "/change-password") {
    return NextResponse.redirect(new URL(`/${routing.defaultLocale}/admin`, request.url));
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/",
    "/(zh|en)/:path*",
    "/admin/:path*",
    "/login",
    "/change-password",
  ],
};
