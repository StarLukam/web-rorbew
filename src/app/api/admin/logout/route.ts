import { clearAdminCookie } from "@/lib/adminAuth";
export async function POST() {
  await clearAdminCookie();
  return Response.json({ ok: true });
}
