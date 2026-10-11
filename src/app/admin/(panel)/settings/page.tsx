import { getSettings, logoSrc } from "@/lib/site";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Branding — Digital Cards Admin" };

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="h1">Company branding</h1>
          <p className="muted">Shared by every card: logo, company details and accent colour.</p>
        </div>
      </div>
      <SettingsForm initial={{ companyName: s.companyName, tagline: s.tagline, website: s.website, officePhone: s.officePhone, address: s.address, accent: s.accent, logo: logoSrc(s), customLogo: !!s.logoId }} />
    </>
  );
}
