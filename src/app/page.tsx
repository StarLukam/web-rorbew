"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, Filter, Percent, Search, ShieldCheck, Star, Timer, Trophy } from "lucide-react";
import type { Product, StoreSettings } from "@/lib/types";

type Payload = { settings: StoreSettings | null; products: Product[] };

const defaultSettings: StoreSettings = {
  id: 1,
  store_name: "Adicoran",
  badge_text: "Store akun game",
  headline: "Mau beli akun game apa?",
  description: "Pilih game, cek produk unggulan, lalu order langsung ke admin.",
  whatsapp_number: "",
  notice_text: "Promo bisa berubah kapan saja selama stok masih ada.",
  hero_note: "Simple store, fast response.",
  footer_text: "© Adicoran",
};

const starterGames = ["Mobile Legends", "The Spike", "Free Fire", "Roblox"];

function money(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
}
function slug(game: string) { return encodeURIComponent(game.toLowerCase().replaceAll(" ", "-")); }
function promoActive(p: Product) { return Boolean(p.discount_percent && (!p.promo_ends_at || new Date(p.promo_ends_at) > new Date())); }
function finalPrice(p: Product) { return promoActive(p) ? Math.round(p.price * (1 - Number(p.discount_percent || 0) / 100)) : p.price; }
function promoCountdown(p: Product) {
  if (!p.promo_ends_at || !promoActive(p)) return "Promo aktif";
  const diff = new Date(p.promo_ends_at).getTime() - Date.now();
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days} hari ${hours} jam lagi`;
  if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
  return `${Math.max(minutes, 0)} menit lagi`;
}
function wa(product: Product, settings: StoreSettings) {
  const number = product.whatsapp_number || settings.whatsapp_number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  const text = `Halo admin ${settings.store_name}, saya mau order ${product.title}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export default function Home() {
  const [data, setData] = useState<Payload>({ settings: defaultSettings, products: [] });
  const [q, setQ] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("ready");
  const [sort, setSort] = useState("featured");
  const [promoOnly, setPromoOnly] = useState(false);

  async function load() {
    const res = await fetch("/api/public/store", { cache: "no-store" });
    const json = await res.json();
    setData({ settings: json.settings || defaultSettings, products: json.products || [] });
  }

  useEffect(() => { load(); }, []);
  const settings = data.settings || defaultSettings;
  const visible = data.products.filter((p) => p.status !== "hidden");
  const games = useMemo(() => Array.from(new Set([...starterGames, ...visible.map((p) => p.game)])).sort(), [visible]);

  const gameCards = useMemo(() => {
    const map = new Map<string, { game: string; count: number; maxDiscount: number; sample?: string }>();
    for (const name of starterGames) map.set(name.toLowerCase(), { game: name, count: 0, maxDiscount: 0 });
    for (const p of visible) {
      const key = p.game.toLowerCase();
      const item = map.get(key) || { game: p.game, count: 0, maxDiscount: 0, sample: p.images?.[0]?.image_url };
      item.count += 1;
      item.maxDiscount = Math.max(item.maxDiscount, promoActive(p) ? Number(p.discount_percent || 0) : 0);
      item.sample ||= p.images?.[0]?.image_url;
      map.set(key, item);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.game.localeCompare(b.game));
  }, [visible]);

  const promos = visible.filter(promoActive).slice(0, 6);
  const featured = visible.filter((p) => p.featured || promoActive(p)).slice(0, 8);
  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return visible
      .filter((p) => (gameFilter === "all" ? true : p.game === gameFilter))
      .filter((p) => (statusFilter === "all" ? true : statusFilter === "ready" ? p.status === "available" : p.status === "sold"))
      .filter((p) => (promoOnly ? promoActive(p) : true))
      .filter((p) => !needle || `${p.title} ${p.game} ${p.category} ${p.description} ${p.tags?.join(" ")}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (sort === "cheap") return finalPrice(a) - finalPrice(b);
        if (sort === "expensive") return finalPrice(b) - finalPrice(a);
        if (sort === "new") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sort === "promo") return Number(promoActive(b)) - Number(promoActive(a)) || Number(b.discount_percent || 0) - Number(a.discount_percent || 0);
        return Number(b.featured) - Number(a.featured) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [visible, q, gameFilter, statusFilter, promoOnly, sort]);

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-stone-950 font-black text-white">A</div>
            <div>
              <p className="text-lg font-black leading-none">{settings.store_name}</p>
              <p className="text-xs text-stone-500">{settings.badge_text}</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-bold text-stone-600 md:flex">
            <a href="#games" className="hover:text-stone-950">Game</a>
            <a href="#promo" className="hover:text-stone-950">Promo</a>
            <a href="#produk" className="hover:text-stone-950">Produk</a>
          </nav>
          <Link href="/admin" className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-950 hover:text-white">Admin</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-stone-200 md:p-10">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-stone-700"><ShieldCheck size={16} /> {settings.hero_note}</p>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">{settings.headline}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">{settings.description}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#games" className="rounded-2xl bg-stone-950 px-6 py-4 text-center font-black text-white hover:bg-stone-800">Lihat Game</a>
              <a href="#produk" className="rounded-2xl border border-stone-300 px-6 py-4 text-center font-black hover:bg-stone-50">Filter Produk</a>
            </div>
          </div>
          <div className="rounded-[2rem] bg-amber-100 p-7 shadow-sm ring-1 ring-amber-200">
            <p className="flex items-center gap-2 font-black text-amber-950"><Percent size={20} /> Promo aktif</p>
            <h2 className="mt-4 text-3xl font-black">Diskon & produk unggulan</h2>
            <p className="mt-3 text-sm leading-6 text-amber-950/80">{settings.notice_text}</p>
            <div className="mt-6 space-y-3">
              {promos.length ? promos.slice(0, 3).map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="flex items-center justify-between rounded-2xl bg-white/80 p-4 hover:bg-white">
                  <div>
                    <p className="font-black">{p.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-stone-600"><Timer size={14} /> {promoCountdown(p)}</p>
                  </div>
                  <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-black text-white">-{p.discount_percent}%</span>
                </Link>
              )) : <p className="rounded-2xl bg-white/70 p-4 text-sm">Belum ada promo aktif. Tambahkan dari admin.</p>}
            </div>
          </div>
        </div>
      </section>

      <section id="games" className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-stone-500">Pilih game</p>
            <h2 className="text-3xl font-black">Mau beli akun game apa?</h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {gameCards.map((g) => (
            <Link href={`/games/${slug(g.game)}`} key={g.game} className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="h-32 bg-stone-200">
                {g.sample ? <img src={g.sample} alt={g.game} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-4xl font-black text-stone-400">{g.game.slice(0, 2).toUpperCase()}</div>}
              </div>
              <div className="p-5">
                {g.maxDiscount > 0 && <span className="mb-3 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">-{g.maxDiscount}%</span>}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black">{g.game}</h3>
                    <p className="text-sm text-stone-500">{g.count} Produk</p>
                  </div>
                  <ChevronRight className="transition group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="promo" className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-stone-500">Etalase</p>
            <h2 className="text-3xl font-black">Produk unggulan</h2>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.length ? featured.map((p) => <ProductCard key={p.id} product={p} settings={settings} />) : <p className="rounded-3xl bg-white p-6 text-stone-500 ring-1 ring-stone-200">Belum ada produk unggulan.</p>}
        </div>
      </section>

      <section id="produk" className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <div className="mb-5 flex items-center gap-2 font-black"><Filter size={20} /> Filter produk</div>
          <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
            <label className="flex items-center gap-3 rounded-2xl bg-stone-100 px-4 py-3"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} className="w-full bg-transparent outline-none" placeholder="Cari akun, game, rank, skin..." /></label>
            <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 font-bold"><option value="all">Semua game</option>{games.map((g) => <option key={g} value={g}>{g}</option>)}</select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 font-bold"><option value="ready">Ready</option><option value="sold">Sold</option><option value="all">Semua status</option></select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 font-bold"><option value="featured">Unggulan</option><option value="promo">Promo</option><option value="new">Terbaru</option><option value="cheap">Termurah</option><option value="expensive">Termahal</option></select>
            <button onClick={() => setPromoOnly(!promoOnly)} className={`rounded-2xl px-4 py-3 font-black ${promoOnly ? "bg-red-600 text-white" : "bg-stone-100 text-stone-700"}`}>Promo</button>
          </div>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} settings={settings} />)}
          {!filtered.length && <div className="rounded-3xl bg-white p-8 text-stone-500 ring-1 ring-stone-200">Produk tidak ketemu. Coba ubah filter.</div>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5 flex items-center gap-2">
          <Trophy size={22} />
          <h2 className="text-3xl font-black">Kenapa pilih {settings.store_name}?</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Fast response", "Order langsung lewat WhatsApp, cocok buat tanya detail dulu."],
            ["Etalase jelas", "Pilih game, filter produk, cek promo, lalu lihat detail akun."],
            ["Promo terjadwal", "Diskon bisa diatur sampai tanggal tertentu dari admin."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <p className="text-xl font-black">{title}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-8 border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-stone-500">{settings.footer_text}</div>
      </footer>
    </main>
  );
}

function ProductCard({ product, settings }: { product: Product; settings: StoreSettings }) {
  const img = product.images?.[0]?.image_url;
  const activePromo = promoActive(product);
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative h-44 bg-stone-200">
          {img ? <img src={img} alt={product.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-stone-400">No Image</div>}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {product.status === "sold" && <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-white">SOLD</span>}
            {product.featured && <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-white"><Star size={12} className="mr-1 inline" />Unggulan</span>}
            {activePromo && <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">-{product.discount_percent}%</span>}
          </div>
        </div>
      </Link>
      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-wider text-stone-500">{product.game}</p>
        <Link href={`/products/${product.id}`}><h3 className="mt-1 line-clamp-2 min-h-[3.5rem] text-lg font-black hover:underline">{product.title}</h3></Link>
        {activePromo && <p className="mt-2 flex items-center gap-1 text-xs font-bold text-red-700"><Clock size={14} /> {promoCountdown(product)}</p>}
        <div className="mt-4">
          {activePromo && <p className="text-sm text-stone-400 line-through">{money(product.price)}</p>}
          <p className="text-2xl font-black">{money(finalPrice(product))}</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link href={`/products/${product.id}`} className="rounded-2xl border border-stone-300 px-4 py-3 text-center font-black hover:bg-stone-50">Detail</Link>
          <a href={wa(product, settings)} target="_blank" className="rounded-2xl bg-stone-950 px-4 py-3 text-center font-black text-white hover:bg-stone-800">Order</a>
        </div>
      </div>
    </article>
  );
}
