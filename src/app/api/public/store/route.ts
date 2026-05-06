import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("store_settings")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({
      store_name: "Adicoran",
      badge_text: "Akun Game Store",
      headline: "Mau beli akun game apa?",
      description: "Pilih game, cek promo aktif, lihat produk unggulan, lalu order langsung via WhatsApp.",
      whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
      notice_text: "Transaksi dilakukan via WhatsApp.",
    });
  }

  return NextResponse.json(data);
}
