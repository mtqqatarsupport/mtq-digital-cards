import { redirect } from "next/navigation";
import { getSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

// The root never lists staff (privacy). Visitors go to the company website.
export default async function Home() {
  const s = await getSettings();
  redirect(s.website || "/admin/login");
}
