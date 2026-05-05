import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { data, error } = await supabaseAdmin.from("store_settings").select("*").eq("id", 1).single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ settings: data });
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json();
  const payload = {
    id: 1,
    store_name: body.store_name || "Adicoran",
    badge_text: body.badge_text || "Akun game pilihan",
    headline: body.headline || "Pilih akun game favoritmu",
    description: body.description || "Etalase akun game simpel, rapi, dan cepat.",
    whatsapp_number: body.whatsapp_number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    notice_text: body.notice_text || "",
    hero_note: body.hero_note || "",
    footer_text: body.footer_text || "© Adicoran",
  };
  const { data, error } = await supabaseAdmin.from("store_settings").upsert(payload).select("*").single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ settings: data });
}
