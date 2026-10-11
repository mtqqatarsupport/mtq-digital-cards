import { listAudit } from "@/lib/store";

export const metadata = { title: "Activity — Digital Cards Admin" };

const fmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Qatar" });

export default async function ActivityPage() {
  const rows = await listAudit(200);
  return (
    <>
      <div className="page-head"><div><h1 className="h1">Activity</h1><p className="muted">Sign-ins, blocked attempts and changes, newest first (last 200).</p></div></div>
      <div className="panel table-wrap">
        <table className="table">
          <thead><tr><th>When (Doha)</th><th>Who</th><th>Action</th><th>Detail</th><th>IP</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.action.includes("denied") ? "row-warn" : ""}>
                <td>{fmt.format(r.at)}</td><td>{r.who || "—"}</td><td className="mono">{r.action}</td><td>{r.target}</td><td className="mono small">{r.ip}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="muted">Nothing yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
