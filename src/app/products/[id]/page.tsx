"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, MessageCircle, ShieldCheck, Star } from "lucide-react";
import type { Product, StoreSettings } from "@/lib/types";

type Payload = { settings: StoreSettings | null; products: Product[] };
const fallback: StoreSettings = { id: 1, store_name: "Adicoran", badge_text: "Store akun game", headline: "Adicoran", description: "", whatsapp_number: "", notice_text: "", hero_note: "", footer_text: "© Adicoran" };
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

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Payload>({ settings: fallback, products: [] });
  const [active, setActive] = useState(0);

  useEffect(() => {
    fetch("/api/public/store", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData({ settings: j.settings || fallback, products: j.products || [] }));
  }, []);

  const settings = data.settings || fallback;
  const product = useMemo(() => data.products.find((p) => p.id === params.id), [data.products, params.id]);

  if (!product) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-100 px-4 text-stone-950">
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
          <p className="text-2xl font-black">Produk belum ketemu</p>
          <Link href="/" className="mt-5 inline-block rounded-2xl bg-stone-950 px-5 py-3 font-black text-white">Balik ke Home</Link>
        </div>
      </main>
    );
  }

  const images = product.images || [];
  const img = images[active]?.image_url;
  const activePromo = promoActive(product);

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href={`/games/${encodeURIComponent(product.game.toLowerCase().replaceAll(" ", "-"))}`} className="flex items-center gap-2 font-black"><ArrowLeft size={18} /> {product.game}</Link>
          <Link href="/" className="rounded-full border border-stone-300 px-4 py-2 text-sm font-bold">{settings.store_name}</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[1fr_.85fr]">
        <div className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-stone-200">
          <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[1.5rem] bg-stone-200">
            {img ? <img src={img} alt={product.title} className="h-full w-full object-cover" /> : <span className="text-stone-400">No Image</span>}
          </div>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3 md:grid-cols-8">
              {images.map((image, index) => (
                <button key={image.id} onClick={() => setActive(index)} className={`overflow-hidden rounded-2xl ring-2 ${active === index ? "ring-stone-950" : "ring-transparent"}`}>
                  <img src={image.image_url} alt={`${product.title} ${index + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-stone-200">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700">{product.game}</span>
            {product.category && <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700">{product.category}</span>}
            {product.status === "sold" && <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-white">SOLD</span>}
            {product.featured && <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-white"><Star size={12} className="mr-1 inline" />Unggulan</span>}
            {activePromo && <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">-{product.discount_percent}%</span>}
          </div>

          <h1 className="mt-5 text-3xl font-black md:text-5xl">{product.title}</h1>
          {product.description && <p className="mt-4 whitespace-pre-line leading-8 text-stone-600">{product.description}</p>}

          {activePromo && (
            <div className="mt-6 rounded-3xl bg-red-50 p-5 text-red-800 ring-1 ring-red-100">
              <p className="flex items-center gap-2 font-black"><Clock size={18} /> Promo berakhir dalam {promoCountdown(product)}</p>
              {product.promo_title && <p className="mt-1 text-sm font-bold">{product.promo_title}</p>}
            </div>
          )}

          <div className="mt-7 rounded-3xl bg-stone-100 p-5">
            {activePromo && <p className="text-sm text-stone-400 line-through">{money(product.price)}</p>}
            <p className="text-4xl font-black">{money(finalPrice(product))}</p>
          </div>

          {product.tags?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => <span key={tag} className="rounded-full border border-stone-300 px-3 py-1 text-xs font-bold text-stone-600">#{tag}</span>)}
            </div>
          ) : null}

          <a href={wa(product, settings)} target="_blank" className={`mt-7 flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-center font-black text-white ${product.status === "sold" ? "bg-stone-400" : "bg-stone-950 hover:bg-stone-800"}`}>
            <MessageCircle size={20} /> {product.status === "sold" ? "Tanya Admin" : "Order via WhatsApp"}
          </a>

          <div className="mt-6 rounded-3xl bg-stone-50 p-5 text-sm leading-6 text-stone-600 ring-1 ring-stone-200">
            <p className="flex items-center gap-2 font-black text-stone-950"><ShieldCheck size={18} /> Catatan aman</p>
            <p className="mt-2">Cek detail produk dulu sebelum order. Admin akan konfirmasi stok, harga, dan proses transaksi lewat WhatsApp.</p>
          </div>
        </div>
      </section>
    </main>
  );
            }
