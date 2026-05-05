import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_FILES = 8;
const MAX_SIZE = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function cleanNumber(value: FormDataEntryValue | null) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function cleanTags(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 10);
}

async function uploadImages(files: File[], productId: string) {
  const rows = [];
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    if (!ALLOWED.has(file.type)) throw new Error("File gambar harus JPG, PNG, WEBP, atau GIF.");
    if (file.size > MAX_SIZE) throw new Error("Ukuran gambar maksimal 4MB.");
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${productId}/${Date.now()}-${index}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage.from("product-images").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabaseAdmin.storage.from("product-images").getPublicUrl(path);
    rows.push({ product_id: productId, image_url: data.publicUrl, sort_order: index });
  }
  if (rows.length) await supabaseAdmin.from("product_images").insert(rows);
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*, images:product_images(*)")
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ products: data || [] });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const form = await request.formData();
    const payload = {
      title: String(form.get("title") || "").trim(),
      game: String(form.get("game") || "").trim(),
      category: String(form.get("category") || "").trim(),
      price: cleanNumber(form.get("price")),
      description: String(form.get("description") || "").trim(),
      status: String(form.get("status") || "available"),
      whatsapp_number: String(form.get("whatsapp_number") || "").trim(),
      featured: String(form.get("featured") || "false") === "true",
      tags: cleanTags(form.get("tags")),
      discount_percent: Math.max(0, Math.min(90, cleanNumber(form.get("discount_percent")))),
      promo_title: String(form.get("promo_title") || "").trim(),
      promo_ends_at: String(form.get("promo_ends_at") || "") || null,
    };
    if (!payload.title || !payload.game || !payload.price) {
      return Response.json({ error: "Nama, game, dan harga wajib diisi." }, { status: 400 });
    }

    const { data: product, error } = await supabaseAdmin.from("products").insert(payload).select("*").single();
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const files = form.getAll("images").filter((x): x is File => x instanceof File && x.size > 0).slice(0, MAX_FILES);
    if (files.length) await uploadImages(files, product.id);

    return Response.json({ product });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Gagal membuat produk." }, { status: 500 });
  }
      }
