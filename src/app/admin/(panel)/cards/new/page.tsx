import Link from "next/link";
import { CardForm } from "@/components/CardForm";
import { baseUrl } from "@/lib/site";

export const metadata = { title: "New card — Digital Cards Admin" };

export default function NewCardPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/admin" className="small muted">← All cards</Link>
          <h1 className="h1">New card</h1>
        </div>
      </div>
      <CardForm baseUrl={baseUrl()} initial={{ fullName: "", jobTitle: "", department: "", slug: "", mobile: "", phone: "", whatsapp: "", email: "", website: "", linkedin: "", isActive: true }} />
    </>
  );
}
