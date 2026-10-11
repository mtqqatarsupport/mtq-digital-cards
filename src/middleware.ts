import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/admins";

// 1) Per-request nonce Content-Security-Policy on every page.
// 2) Quick gate for /admin: no session cookie → login page. The cookie itself
//    is fully verified with Firebase (and checked against the allow-list) by
//    every admin page, action and download.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login";

  if (pathname.startsWith("/admin") && !isLogin && !req.cookies.get(SESSION_COOKIE)?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  const authDomain = (process.env.FIREBASE_AUTH_DOMAIN ?? "").replace(/[^a-zA-Z0-9.-]/g, "");
  // Google sign-in (Firebase Auth) needs to talk to Google — only on the login page.
  const google = isLogin
    ? {
        connect: " https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://apis.google.com",
        frame: ` https://apis.google.com https://accounts.google.com${authDomain ? ` https://${authDomain}` : ""}`,
      }
    : { connect: "", frame: "" };

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${google.connect}`,
    `frame-src 'self'${google.frame}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Cards may be framed by our own admin (live preview); admin pages never.
    pathname.startsWith("/admin") ? "frame-ancestors 'none'" : "frame-ancestors 'self'",
    process.env.VERCEL ? "upgrade-insecure-requests" : "",
  ].filter(Boolean).join("; ");

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-nonce", nonce);
  reqHeaders.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers: reqHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/img|brand/|favicon.ico|robots.txt).*)"],
};
