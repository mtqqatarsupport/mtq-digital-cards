"use client";
import { useActionState } from "react";
import { saveCardAction, type FormState } from "@/app/admin/actions";
import { Field, FormMessage, ImageInput, Submit } from "./forms";

export type CardFormValues = {
  id?: string; fullName: string; jobTitle: string; department: string; slug: string; mobile: string; phone: string;
  whatsapp: string; email: string; website: string; linkedin: string; isActive: boolean; photo?: string | null;
};

export function CardForm({ initial, baseUrl }: { initial: CardFormValues; baseUrl: string }) {
  const [s, action] = useActionState<FormState, FormData>(saveCardAction, {});
  const e = s.errors ?? {};
  // React resets a form after its action runs; re-seed with what was submitted so nothing is lost on errors.
  const v = { ...initial, ...(s.values ?? {}) } as CardFormValues;
  return (
    <form action={action} className="panel form-grid" key={JSON.stringify(s.values ?? null)}>
      <FormMessage state={s} />
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <section className="form-section">
        <h2 className="h3">Person</h2>
        <ImageInput name="photo" label="Photo" current={initial.photo} error={e.photo} removeName="removePhoto" />
        <div className="cols-2">
          <Field label="Full name" name="fullName" defaultValue={v.fullName} required maxLength={80} error={e.fullName} />
          <Field label="Position" name="jobTitle" defaultValue={v.jobTitle} required maxLength={80} error={e.jobTitle} />
        </div>
        <Field label="Department badge (optional)" name="department" defaultValue={v.department} maxLength={30} error={e.department} placeholder="IT" hint="Shown as a small badge on the photo — keep it short" />
      </section>

      <section className="form-section">
        <h2 className="h3">Contact</h2>
        <div className="cols-2">
          <Field label="Mobile" name="mobile" type="tel" defaultValue={v.mobile} maxLength={30} error={e.mobile} placeholder="+974 3377 5853" />
          <Field label="Direct office line (optional)" name="phone" type="tel" defaultValue={v.phone} maxLength={30} error={e.phone} hint="Blank = company office number" />
          <Field label="WhatsApp (optional)" name="whatsapp" inputMode="numeric" defaultValue={v.whatsapp} maxLength={20} error={e.whatsapp} placeholder="97433775853" hint="Country code + number, digits only" />
          <Field label="Email (optional)" name="email" type="email" defaultValue={v.email} maxLength={120} error={e.email} />
          <Field label="Website (optional)" name="website" defaultValue={v.website} maxLength={300} error={e.website} hint="Blank = company website" />
          <Field label="LinkedIn (optional)" name="linkedin" defaultValue={v.linkedin} maxLength={300} error={e.linkedin} placeholder="linkedin.com/in/…" />
        </div>
      </section>

      <section className="form-section">
        <h2 className="h3">Card link</h2>
        <Field label="Link name" name="slug" defaultValue={v.slug} maxLength={60} error={e.slug}
          hint={`${baseUrl.replace(/^https?:\/\//, "")}/<link-name> · blank = made from the name. Changing it breaks NFC tags already written.`} />
        <label className="check">
          <input type="checkbox" name="isActive" defaultChecked={v.isActive} /> Card is live (untick to switch it off without deleting)
        </label>
      </section>

      <div className="form-actions">
        <Submit>{initial.id ? "Save changes" : "Create card"}</Submit>
      </div>
    </form>
  );
}
