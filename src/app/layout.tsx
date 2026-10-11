import type { Metadata, Viewport } from "next";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { baseUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  title: { default: "MechaTronics Digital Cards", template: "%s" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06120C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
