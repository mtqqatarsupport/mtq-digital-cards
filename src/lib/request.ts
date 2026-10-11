import "server-only";
import { headers } from "next/headers";

export async function clientIp(): Promise<string> {
  const h = await headers();
  const raw =
    h.get("x-vercel-forwarded-for") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0] ||
    "unknown";
  return raw.trim().slice(0, 64);
}
