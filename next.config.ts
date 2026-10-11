import type { NextConfig } from "next";

// Static security headers. The Content-Security-Policy (with a per-request
// nonce) is set in src/middleware.ts.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["sharp", "firebase-admin"],
  // The bundled logo is read from disk when generating printable QR codes.
  outputFileTracingIncludes: { "/admin/**": ["./public/brand/logo.png"] },
  experimental: {
    serverActions: {
      // Photos are downscaled in the browser before upload; this is a hard cap.
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Google sign-in opens a popup that must be able to report back.
      { source: "/admin/login", headers: [{ key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" }] },
      { source: "/admin/:path*", headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
