import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_FILES = 8;
const MAX_SIZE = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type Params = { params: Promise<{ id: string }> };
function num(value: FormDataEntryValue | null) { const n = Number(value || 0); return Number.isFinite(n) ? n : 0; }
function tags(value: FormDataEntryValue | null) { return String(value || "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 10); }

async function uploadImages(files: File[], productId: string) {
  const rows = [];
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    if (!ALLOWED.has(file.type)) throw new Error("File gambar harus JPG, PNG, WEBP, atau GIF.");
    if (file.size > MAX_SIZE) throw new Error("Ukuran gambar maksimal 4MB.");
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${productId}/${Date.now()}-${index}.${ext}`;
    const { error } = await supabaseAdmin.storage.from("product-images").upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw new Error(error.message);
    const { data } = supabaseAdmin.storage.from("product-images").getPublicUrl(path);
    rows.push({ product_id: productId, image_url: data.publicUrl, sort_order: index });
  }
  if (rows.length) await supabaseAdmin.from("product_images").insert(rows);
}

export async function PUT(request: Request, ctx: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const form = await request.formData();
    const payload = {
      title: String(form.get("title") || "").trim(),
      game: String(form.get("game") || "").trim(),
      category: String(form.get("category") || "").trim(),
      price: num(form.get("price")),
      description: String(form.get("description") || "").trim(),
      status: String(form.get("status") || "available"),
      whatsapp_number: String(form.get("whatsapp_number") || "").trim(),
      featured: String(form.get("featured") || "false") === "true",
      tags: tags(form.get("tags")),
      discount_percent: Math.max(0, Math.min(90, num(form.get("discount_percent")))),
      promo_title: String(form.get("promo_title") || "").trim(),
      promo_ends_at: String(form.get("promo_ends_at") || "") || null,
    };
    const { error } = await supabaseAdmin.from("products").update(payload).eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const files = form.getAll("images").filter((x): x is File => x instanceof File && x.size > 0).slice(0, MAX_FILES);
    if (files.length) {
      await supabaseAdmin.from("product_images").delete().eq("product_id", id);
      await uploadImages(files, id);
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Gagal update produk." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  await supabaseAdmin.from("product_images").delete().eq("product_id", id);
  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
    }
