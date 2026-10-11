import "server-only";
import { addAudit } from "./store";
import { clientIp } from "./request";

export async function audit(who: string | null, action: string, target = "") {
  try {
    await addAudit({ who: who ?? "", action, target: target.slice(0, 200), ip: await clientIp() });
  } catch (e) {
    console.error("audit log failed", e);
  }
}
