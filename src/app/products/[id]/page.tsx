import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Product, StoreSettings } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

function gameSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replaceAll("&", "and")
    .replaceAll(" ", "-")
    .replace(/[^a-z0-9-]/g, "");
}

function isPromoActive(product: Product) {
  if (!product.discount_percent || !product.promo_ends_at) return false;
  return new Date(product.promo_ends_at).getTime() > Date.now();
}

function promoText(product: Product) {
  if (!product.promo_ends_at) return "";

  const end = new Date(product.promo_ends_at).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return "Promo berakhir";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  if (days > 0) return `Promo berakhir ${days} hari ${hours} jam lagi`;
  return `Promo berakhir ${hours} jam lagi`;
}

async function getStoreSettings(): Promise<StoreSettings> {
  const { data } = await supabaseAdmin
    .from("store_settings")
    .select("*")
    .limit(1)
    .single();

  return {
    id: data?.id || 1,
    store_name: data?.store_name || "Adicoran",
    badge_text: data?.badge_text || "Akun Game Store",
    headline: data?.headline || "Mau beli akun game apa?",
    description:
      data?.description ||
      "Pilih game, cek promo aktif, lihat produk unggulan, lalu order langsung via WhatsApp.",
    whatsapp_number:
      data?.whatsapp_number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    notice_text: data?.notice_text || "Transaksi dilakukan via WhatsApp.",
    hero_note: data?.hero_note || "Simple store, fast response.",
    footer_text: data?.footer_text || "© Adicoran",
    trust_text: data?.trust_text || "Diproses manual via WhatsApp.",
  };
}

async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      `
      *,
      images:product_images(*)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return data as Product;
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const store = await getStoreSettings();
  const product = await getProduct(params.id);

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-zinc-950">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-black">Produk belum ketemu</h1>
          <p className="mt-3 text-zinc-500">
            Produk mungkin sudah dihapus atau link-nya salah.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-2xl bg-zinc-950 px-6 py-3 font-bold text-white"
          >
            Balik ke Home
          </Link>
        </div>
      </main>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [
          {
            id: "fallback",
            product_id: product.id,
            image_url: `/games/${gameSlug(product.game || "the-spike")}.png`,
            sort_order: 0,
          },
        ];

  const activePromo = isPromoActive(product);

  const finalPrice =
    activePromo && product.discount_percent
      ? product.price -
        Math.round((product.price * product.discount_percent) / 100)
      : product.price;

  const whatsappNumber =
    product.whatsapp_number ||
    store.whatsapp_number ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    "";

  const orderText = encodeURIComponent(
    `Halo admin ${store.store_name}, saya mau order produk:\n\n${product.title}\nGame: ${product.game}\nHarga: ${formatPrice(finalPrice)}`
  );

  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${orderText}`
    : "#";

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-black">
            ← {store.store_name}
          </Link>

          <Link
            href={`/games/${gameSlug(product.game || "")}`}
            className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-800"
          >
            {product.game}
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth rounded-[1.5rem]">
            {images.slice(0, 8).map((image, index) => (
              <div key={image.id} className="min-w-full snap-center">
                <img
                  src={image.image_url}
                  alt={`${product.title} foto ${index + 1}`}
                  className="h-80 w-full rounded-[1.5rem] bg-zinc-100 object-cover sm:h-[520px]"
                />
              </div>
            ))}
          </div>

          {images.length > 1 ? (
            <>
              <div className="mt-4 flex justify-center gap-2">
                {images.slice(0, 8).map((image, index) => (
                  <span
                    key={image.id}
                    className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-bold text-zinc-600"
                  >
                    {index + 1}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-center text-sm text-zinc-500">
                Geser foto ke kiri atau kanan
              </p>
            </>
          ) : null}
        </div>

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
              {product.game}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                product.status === "sold"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {product.status === "sold" ? "Sold" : "Ready"}
            </span>

            {product.featured ? (
              <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-bold text-white">
                Unggulan
              </span>
            ) : null}

            {activePromo ? (
              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                -{product.discount_percent}%
              </span>
            ) : null}
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight">
            {product.title}
          </h1>

          <div className="mt-5">
            {activePromo ? (
              <>
                <p className="text-lg text-zinc-400 line-through">
                  {formatPrice(product.price)}
                </p>
                <p className="text-4xl font-black">{formatPrice(finalPrice)}</p>
                <p className="mt-2 text-sm font-bold text-red-600">
                  {promoText(product)}
                </p>
              </>
            ) : (
              <p className="text-4xl font-black">{formatPrice(product.price)}</p>
            )}
          </div>

          <div className="mt-6 rounded-3xl bg-zinc-50 p-5">
            <h2 className="font-black">Deskripsi</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-zinc-600">
              {product.description || "Belum ada deskripsi produk."}
            </p>
          </div>

          {product.tags && product.tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a
              href={waLink}
              target="_blank"
              className={`rounded-2xl px-5 py-4 text-center font-black text-white ${
                product.status === "sold"
                  ? "pointer-events-none bg-zinc-400"
                  : "bg-zinc-950 hover:bg-zinc-800"
              }`}
            >
              {product.status === "sold" ? "Produk Sold" : "Order WhatsApp"}
            </a>

            <Link
              href={`/games/${gameSlug(product.game || "")}`}
              className="rounded-2xl bg-zinc-100 px-5 py-4 text-center font-black text-zinc-950 hover:bg-zinc-200"
            >
              Lihat Produk Sejenis
            </Link>
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            {store.trust_text || "Diproses manual via WhatsApp."}
          </p>
        </div>
      </section>
    </main>
  );
          }
