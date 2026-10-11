"use client";
import { useActionState } from "react";
import { saveSettingsAction, type FormState } from "../../actions";
import { Field, FormMessage, ImageInput, Submit } from "@/components/forms";

type V = { companyName: string; tagline: string; website: string; officePhone: string; address: string; accent: string; logo: string | null; customLogo: boolean };

export function SettingsForm({ initial }: { initial: V }) {
  const [s, action] = useActionState<FormState, FormData>(saveSettingsAction, {});
  const e = s.errors ?? {};
  return (
    <form action={action} className="panel form-grid">
      <FormMessage state={s} />
      <ImageInput name="logo" label="Company logo" current={initial.logo} shape="logo" error={e.logo} removeName={initial.customLogo ? "removeLogo" : undefined}
        accept="image/png,image/jpeg,image/webp,image/svg+xml" maxSide={1600} />
      <div className="cols-2">
        <Field label="Company name" name="companyName" defaultValue={initial.companyName} required maxLength={80} error={e.companyName} />
        <Field label="Tagline" name="tagline" defaultValue={initial.tagline} maxLength={120} error={e.tagline} />
        <Field label="Company website" name="website" defaultValue={initial.website} maxLength={300} error={e.website} />
        <Field label="Office phone" name="officePhone" defaultValue={initial.officePhone} maxLength={30} error={e.officePhone} />
      </div>
      <Field label="Address" name="address" defaultValue={initial.address} maxLength={160} error={e.address} />
      <label className="field">
        <span className="field-label">Accent colour</span>
        <span className="color-row">
          <input type="color" name="accent" defaultValue={initial.accent} />
          <span className="field-hint">Colour of the “Save my contact” button. Default is warm gold from the logo (#E3AE6A).</span>
        </span>
        {e.accent && <span className="field-error">{e.accent}</span>}
      </label>
      <div className="form-actions"><Submit>Save branding</Submit></div>
    </form>
  );
}
