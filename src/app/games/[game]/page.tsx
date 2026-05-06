"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Filter, Search, Star } from "lucide-react";
import type { Product, StoreSettings } from "@/lib/types";

type Payload = { settings: StoreSettings | null; products: Product[] };
const fallback: StoreSettings = { id: 1, store_name: "Adicoran", badge_text: "Store akun game", headline: "Adicoran", description: "", whatsapp_number: "", notice_text: "", hero_note: "", footer_text: "© Adicoran" };
function toTitle(slug: string) { return decodeURIComponent(slug).replaceAll("-", " "); }
function money(n: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0); }
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
  return `https://wa.me/${number}?text=${encodeURIComponent(`Halo admin ${settings.store_name}, saya mau order ${product.title}`)}`;
}

export default function GamePage() {
  const params = useParams<{ game: string }>();
  const gameName = toTitle(params.game || "");
  const [data, setData] = useState<Payload>({ settings: fallback, products: [] });
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("featured");
  const [statusFilter, setStatusFilter] = useState("ready");
  const [promoOnly, setPromoOnly] = useState(false);

  useEffect(() => {
    fetch("/api/public/store", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData({ settings: j.settings || fallback, products: j.products || [] }));
  }, []);

  const settings = data.settings || fallback;
  const products = useMemo(() => {
    const items = data.products.filter((p) => p.status !== "hidden" && p.game.toLowerCase() === gameName.toLowerCase());
    const searched = q ? items.filter((p) => `${p.title} ${p.category} ${p.description} ${p.tags?.join(" ")}`.toLowerCase().includes(q.toLowerCase())) : items;
    return searched
      .filter((p) => (statusFilter === "all" ? true : statusFilter === "ready" ? p.status === "available" : p.status === "sold"))
      .filter((p) => (promoOnly ? promoActive(p) : true))
      .sort((a, b) => {
        if (sort === "cheap") return finalPrice(a) - finalPrice(b);
        if (sort === "expensive") return finalPrice(b) - finalPrice(a);
        if (sort === "new") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sort === "promo") return Number(promoActive(b)) - Number(promoActive(a)) || Number(b.discount_percent || 0) - Number(a.discount_percent || 0);
        return Number(b.featured) - Number(a.featured) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [data.products, gameName, q, sort, statusFilter, promoOnly]);

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 font-black"><ArrowLeft size={18} /> {settings.store_name}</Link>
          <Link href="/admin" className="rounded-full border border-stone-300 px-4 py-2 text-sm font-bold">Admin</Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-black uppercase tracking-widest text-stone-500">Kategori game</p>
          <h1 className="mt-2 text-4xl font-black capitalize md:text-6xl">{gameName}</h1>
          <p className="mt-3 text-stone-600">{products.length} produk sesuai filter.</p>
          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_180px_180px_auto]">
            <label className="flex items-center gap-3 rounded-2xl bg-stone-100 px-4 py-3"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} className="w-full bg-transparent outline-none" placeholder="Cari produk di game ini..." /></label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 font-bold"><option value="ready">Ready</option><option value="sold">Sold</option><option value="all">Semua</option></select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 font-bold"><option value="featured">Unggulan</option><option value="promo">Promo</option><option value="new">Terbaru</option><option value="cheap">Termurah</option><option value="expensive">Termahal</option></select>
            <button onClick={() => setPromoOnly(!promoOnly)} className={`rounded-2xl px-4 py-3 font-black ${promoOnly ? "bg-red-600 text-white" : "bg-stone-100 text-stone-700"}`}>Promo</button>
            <span className="hidden items-center gap-2 rounded-2xl bg-stone-100 px-4 py-3 text-sm font-bold text-stone-600 md:flex"><Filter size={16} /> Filter</span>
          </div>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} settings={settings} />)}
          {!products.length && <div className="rounded-3xl bg-white p-8 text-stone-500 ring-1 ring-stone-200">Belum ada produk untuk filter ini.</div>}
        </div>
      </section>
    </main>
  );
}

function ProductCard({ product, settings }: { product: Product; settings: StoreSettings }) {
  const img = product.images?.[0]?.image_url;
  const activePromo = promoActive(product);
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative h-48 bg-stone-200">
          {img ? <img src={img} alt={product.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-stone-400">No Image</div>}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {product.status === "sold" && <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-white">SOLD</span>}
            {product.featured && <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-white"><Star size={12} className="mr-1 inline" />Unggulan</span>}
            {activePromo && <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">-{product.discount_percent}%</span>}
          </div>
        </div>
      </Link>
      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-wider text-stone-500">{product.category || product.game}</p>
        <Link href={`/products/${product.id}`}><h3 className="mt-1 line-clamp-2 min-h-[3.5rem] text-lg font-black hover:underline">{product.title}</h3></Link>
        {product.description && <p className="mt-2 line-clamp-2 text-sm text-stone-500">{product.description}</p>}
        {activePromo && <p className="mt-3 flex items-center gap-1 text-xs font-bold text-red-700"><Clock size={14} /> {promoCountdown(product)}</p>}
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
