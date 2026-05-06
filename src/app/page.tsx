import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Product, StoreSettings } from "@/lib/types";

function gameSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replaceAll("&", "and")
    .replaceAll(" ", "-")
    .replace(/[^a-z0-9-]/g, "");
}

function gameImage(name: string) {
  return `/games/${gameSlug(name)}.png`;
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
    hero_note: data?.hero_note || "Akun ready, promo aktif, fast response.",
    footer_text: data?.footer_text || "© Adicoran",
    trust_text: data?.trust_text || "Diproses manual via WhatsApp.",
  };
}

async function getProducts(): Promise<Product[]> {
  const { data } = await supabaseAdmin
    .from("products")
    .select(
      `
      *,
      images:product_images(*)
    `
    )
    .order("created_at", { ascending: false });

  return (data || []) as Product[];
}

export default async function HomePage() {
  const store = await getStoreSettings();
  const products = await getProducts();

  const gameMap = new Map<string, number>();

  products.forEach((product) => {
    if (!product.game) return;
    gameMap.set(product.game, (gameMap.get(product.game) || 0) + 1);
  });

  const games = Array.from(gameMap.entries()).map(([name, count]) => ({
    name,
    count,
    slug: gameSlug(name),
    image: gameImage(name),
  }));

  const featuredProducts = products
    .filter((product) => product.featured)
    .slice(0, 6);

  const promoProducts = products
    .filter((product) => isPromoActive(product))
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link href="/" className="flex flex-col">
            <span className="text-2xl font-black tracking-tight">
              {store.store_name}
            </span>
            <span className="text-sm text-zinc-500">{store.badge_text}</span>
          </Link>

          <nav className="flex items-center gap-3 text-sm font-semibold">
            <a href="#games" className="rounded-full px-4 py-2 hover:bg-zinc-100">
              Game
            </a>
            <a href="#promo" className="rounded-full px-4 py-2 hover:bg-zinc-100">
              Promo
            </a>
            <a
              href="/admin"
              className="rounded-full bg-zinc-950 px-4 py-2 text-white hover:bg-zinc-800"
            >
              Admin
            </a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm lg:grid-cols-[1.4fr_0.8fr] lg:p-10">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700">
              {store.hero_note}
            </p>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              {store.headline}
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
              {store.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#games"
                className="rounded-2xl bg-zinc-950 px-6 py-3 font-bold text-white hover:bg-zinc-800"
              >
                Pilih Game
              </a>
              <a
                href="#promo"
                className="rounded-2xl bg-zinc-100 px-6 py-3 font-bold text-zinc-950 hover:bg-zinc-200"
              >
                Lihat Promo
              </a>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-zinc-100 p-6">
            <p className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Promo aktif
            </p>
            <h2 className="mt-3 text-3xl font-black">
              {promoProducts.length > 0
                ? "Diskon lagi jalan"
                : "Belum ada promo aktif"}
            </h2>
            <p className="mt-3 text-zinc-600">{store.notice_text}</p>

            <div className="mt-6 space-y-3">
              {promoProducts.slice(0, 3).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="block rounded-2xl bg-white p-4 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{product.title}</p>
                      <p className="text-sm text-zinc-500">
                        {promoText(product)}
                      </p>
                    </div>
                    <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                      -{product.discount_percent}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="games" className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Kategori
            </p>
            <h2 className="text-3xl font-black">Pilih Game</h2>
          </div>
        </div>

        {games.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
            Belum ada produk. Tambahkan produk dulu dari admin.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {games.map((game) => (
              <Link
                key={game.name}
                href={`/games/${game.slug}`}
                className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={game.image}
                  alt={game.name}
                  className="h-36 w-full rounded-2xl bg-zinc-100 object-cover"
                />

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{game.name}</h3>
                    <p className="text-sm text-zinc-500">
                      {game.count} produk tersedia
                    </p>
                  </div>

                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-bold text-zinc-700 group-hover:bg-zinc-950 group-hover:text-white">
                    Lihat
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section id="promo" className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-wider text-zinc-500">
            Diskon
          </p>
          <h2 className="text-3xl font-black">Promo Aktif</h2>
        </div>

        {promoProducts.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-500">
            Belum ada promo aktif.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {promoProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-wider text-zinc-500">
            Rekomendasi
          </p>
          <h2 className="text-3xl font-black">Produk Unggulan</h2>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-500">
            Belum ada produk unggulan. Aktifkan featured dari admin.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 pb-14">
        <div className="grid gap-4 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm md:grid-cols-3">
          <div>
            <h3 className="font-black">Fast Response</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Order diarahkan langsung ke WhatsApp.
            </p>
          </div>
          <div>
            <h3 className="font-black">Bisa Atur Seller</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Setiap produk bisa punya nomor WhatsApp sendiri.
            </p>
          </div>
          <div>
            <h3 className="font-black">Promo Fleksibel</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Diskon bisa diberi batas tanggal dan jam.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{store.footer_text}</p>
          <p>{store.trust_text}</p>
        </div>
      </footer>
    </main>
  );
}

function ProductCard({ product }: { product: Product }) {
  const firstImage =
    product.images && product.images.length > 0
      ? product.images[0].image_url
      : "/games/the-spike.png";

  const activePromo = isPromoActive(product);

  const finalPrice =
    activePromo && product.discount_percent
      ? product.price - Math.round((product.price * product.discount_percent) / 100)
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
