import { createAdminCookie } from "@/lib/adminAuth";

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const now = Date.now();
  const item = attempts.get(ip);
  if (item && item.count >= 8 && item.resetAt > now) {
    return Response.json({ error: "Terlalu banyak percobaan login. Tunggu sebentar." }, { status: 429 });
  }

  const { password } = await request.json().catch(() => ({ password: "" }));
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    const current = attempts.get(ip);
    attempts.set(ip, { count: (current?.count || 0) + 1, resetAt: now + 10 * 60 * 1000 });
    return Response.json({ error: "Password salah." }, { status: 401 });
  }

  attempts.delete(ip);
  await createAdminCookie();
  return Response.json({ ok: true });
}
