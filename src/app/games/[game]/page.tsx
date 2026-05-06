import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Product } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function gameSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replaceAll("&", "and")
    .replaceAll(" ", "-")
    .replace(/[^a-z0-9-]/g, "");
}

function gameNameFromSlug(slug: string) {
  return slug
    .split("-")
    .map((word) => {
      if (word.toLowerCase() === "mlbb") return "MLBB";
      if (word.toLowerCase() === "ff") return "FF";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
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

  if (days > 0) return `Berakhir ${days} hari ${hours} jam lagi`;
  return `Berakhir ${hours} jam lagi`;
}

async function getProductsByGame(gameParam: string): Promise<Product[]> {
  const { data } = await supabaseAdmin
    .from("products")
    .select(
      `
      *,
      images:product_images(*)
    `
    )
    .order("created_at", { ascending: false });

  return ((data || []) as Product[]).filter(
    (product) => gameSlug(product.game || "") === gameParam
  );
}

export default async function GamePage({
  params,
  searchParams,
}: {
  params: { game: string };
  searchParams?: {
    q?: string;
    status?: string;
    sort?: string;
    promo?: string;
  };
}) {
  const gameParam = params.game;
  const rawProducts = await getProductsByGame(gameParam);

  const query = (searchParams?.q || "").toLowerCase().trim();
  const status = searchParams?.status || "all";
  const sort = searchParams?.sort || "newest";
  const promoOnly = searchParams?.promo === "true";

  let products = rawProducts.filter((product) => {
    const searchText = [
      product.title,
      product.game,
      product.category || "",
      product.description || "",
      (product.tags || []).join(" "),
    ]
      .join(" ")
      .toLowerCase();

    const matchSearch = !query || searchText.includes(query);

    const matchStatus =
      status === "all" ||
      (status === "ready" && product.status !== "sold") ||
      (status === "sold" && product.status === "sold");

    const matchPromo = !promoOnly || isPromoActive(product);

    return matchSearch && matchStatus && matchPromo;
  });

  if (sort === "featured") {
    products = products.sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  if (sort === "promo") {
    products = products.sort(
      (a, b) => Number(isPromoActive(b)) - Number(isPromoActive(a))
    );
  }

  if (sort === "cheap") {
    products = products.sort((a, b) => a.price - b.price);
  }

  if (sort === "expensive") {
    products = products.sort((a, b) => b.price - a.price);
  }

  const title =
    rawProducts[0]?.game ||
    (gameParam === "the-spike" ? "The Spike" : gameNameFromSlug(gameParam));

  const promoUrl =
    promoOnly === true
      ? `/games/${gameParam}?status=${status}&sort=${sort}`
      : `/games/${gameParam}?status=${status}&sort=${sort}&promo=true`;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-black">
            ← Adicoran
          </Link>

          <Link
            href="/admin"
            className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-bold text-white"
          >
            Admin
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wider text-zinc-500">
            Kategori Game
          </p>

          <h1 className="mt-2 text-5xl font-black tracking-tight">{title}</h1>

          <p className="mt-3 text-zinc-500">
            {products.length} produk sesuai filter.
          </p>

          <form className="mt-6 grid gap-3 md:grid-cols-[1fr_160px_160px_140px_100px]">
            <div className="rounded-2xl bg-zinc-100 px-4 py-3">
              <input
                name="q"
                defaultValue={query}
                placeholder="Cari produk di game ini"
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
            </div>

            <select
              name="status"
              defaultValue={status}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold outline-none"
            >
              <option value="all">Semua</option>
              <option value="ready">Ready</option>
              <option value="sold">Sold</option>
            </select>

            <select
              name="sort"
              defaultValue={sort}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold outline-none"
            >
              <option value="newest">Terbaru</option>
              <option value="featured">Unggulan</option>
              <option value="promo">Promo</option>
              <option value="cheap">Termurah</option>
              <option value="expensive">Termahal</option>
            </select>

            <Link
              href={promoUrl}
              className={`rounded-2xl px-4 py-3 text-center text-sm font-black ${
                promoOnly
                  ? "bg-red-600 text-white"
                  : "bg-zinc-100 text-zinc-950"
              }`}
            >
              Promo
            </Link>

            <button
              type="submit"
              className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-black text-white"
            >
              Filter
            </button>
          </form>
        </div>

        {products.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-500">
            Belum ada produk untuk filter ini.
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ProductCard({ product }: { product: Product }) {
  const firstImage =
    product.images && product.images.length > 0
      ? product.images[0].image_url
      : `/games/${gameSlug(product.game || "the-spike")}.png`;

  const activePromo = isPromoActive(product);

  const finalPrice =
    activePromo && product.discount_percent
      ? product.price -
        Math.round((product.price * product.discount_percent) / 100)
      : product.price;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative">
        <img
          src={firstImage}
          alt={product.title}
          className="h-48 w-full rounded-2xl bg-zinc-100 object-cover"
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
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
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
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
        </div>

        <h3 className="line-clamp-1 text-lg font-black">{product.title}</h3>

        <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
          {product.description || "Detail akun tersedia di halaman produk."}
        </p>

        <div className="mt-4">
          {activePromo ? (
            <div>
              <p className="text-sm text-zinc-400 line-through">
                {formatPrice(product.price)}
              </p>
              <p className="text-2xl font-black">{formatPrice(finalPrice)}</p>
              <p className="mt-1 text-xs font-semibold text-red-600">
                {promoText(product)}
              </p>
            </div>
          ) : (
            <p className="text-2xl font-black">{formatPrice(product.price)}</p>
          )}
        </div>

        <div className="mt-5 rounded-2xl bg-zinc-950 px-4 py-3 text-center font-bold text-white group-hover:bg-zinc-800">
          Lihat Detail
        </div>
      </div>
    </Link>
  );
              }
