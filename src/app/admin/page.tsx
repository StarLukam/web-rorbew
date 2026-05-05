"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { LogOut, Plus, Save, Trash2 } from "lucide-react";
import type { Product, StoreSettings } from "@/lib/types";

const emptySettings: StoreSettings = {
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

type FormState = {
  id?: string;
  title: string;
  game: string;
  category: string;
  price: string;
  description: string;
  status: string;
  whatsapp_number: string;
  featured: boolean;
  tags: string;
  discount_percent: string;
  promo_title: string;
  promo_ends_at: string;
};

const emptyForm: FormState = {
  title: "",
  game: "The Spike",
  category: "",
  price: "",
  description: "",
  status: "available",
  whatsapp_number: "",
  featured: false,
  tags: "",
  discount_percent: "0",
  promo_title: "",
  promo_ends_at: "",
};

function money(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
}

export default function AdminPage() {
  const [logged, setLogged] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"products" | "settings">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(emptySettings);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  const games = useMemo(() => Array.from(new Set(["Mobile Legends", "The Spike", "Free Fire", "Roblox", ...products.map((p) => p.game)])).sort(), [products]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error || "Login gagal.");
    setLogged(true);
    await loadAll();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLogged(false);
  }

  async function loadAll() {
    const [p, s] = await Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/settings").then((r) => r.json()),
    ]);
    if (p.products) setProducts(p.products);
    if (s.settings) setSettings(s.settings);
  }

  useEffect(() => {
    if (logged) loadAll();
  }, [logged]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  function editProduct(product: Product) {
    setTab("products");
    setForm({
      id: product.id,
      title: product.title,
      game: product.game,
      category: product.category || "",
      price: String(product.price || ""),
      description: product.description || "",
      status: product.status || "available",
      whatsapp_number: product.whatsapp_number || "",
      featured: Boolean(product.featured),
      tags: product.tags?.join(", ") || "",
      discount_percent: String(product.discount_percent || 0),
      promo_title: product.promo_title || "",
      promo_ends_at: product.promo_ends_at ? product.promo_ends_at.slice(0, 16) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key !== "id") body.append(key, String(value));
    });
    if (files) Array.from(files).slice(0, 8).forEach((file) => body.append("images", file));
    const url = form.id ? `/api/admin/products/${form.id}` : "/api/admin/products";
    const method = form.id ? "PUT" : "POST";
    const res = await fetch(url, { method, body });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return setError(json.error || "Gagal simpan produk.");
    setForm(emptyForm);
    setFiles(null);
    await loadAll();
  }

  async function deleteProduct(id: string) {
    if (!confirm("Hapus produk ini?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Gagal hapus produk.");
    await loadAll();
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setLoading(false);
    if (!res.ok) return alert("Gagal simpan setting.");
    await loadAll();
    alert("Setting store tersimpan.");
  }

  if (!logged) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-100 px-4">
        <form onSubmit={login} className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-stone-200">
          <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-stone-950 text-xl font-black text-white">A</div>
          <h1 className="text-3xl font-black">Admin Adicoran</h1>
          <p className="mt-2 text-sm text-stone-500">Masuk buat atur produk, promo, dan setting store.</p>
          {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="ADMIN_PASSWORD" className="mt-6 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:ring-2 focus:ring-stone-900" />
          <button className="mt-4 w-full rounded-2xl bg-stone-950 px-4 py-3 font-black text-white">Login</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xl font-black">Admin {settings.store_name}</p>
            <p className="text-xs text-stone-500">Atur store, produk, diskon, dan promo.</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 rounded-2xl border border-stone-300 px-4 py-2 font-bold"><LogOut size={16} /> Logout</button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex gap-2 rounded-2xl bg-white p-2 ring-1 ring-stone-200">
          <button onClick={() => setTab("products")} className={`flex-1 rounded-xl px-4 py-3 font-black ${tab === "products" ? "bg-stone-950 text-white" : "hover:bg-stone-100"}`}>Produk</button>
          <button onClick={() => setTab("settings")} className={`flex-1 rounded-xl px-4 py-3 font-black ${tab === "settings" ? "bg-stone-950 text-white" : "hover:bg-stone-100"}`}>Setting Store</button>
        </div>

        {error && <p className="mb-4 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}

        {tab === "products" ? (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <form onSubmit={saveProduct} className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <h2 className="mb-5 flex items-center gap-2 text-2xl font-black"><Plus size={22} /> {form.id ? "Edit Produk" : "Tambah Produk"}</h2>
              <div className="space-y-4">
                <Field label="Nama produk"><input value={form.title} onChange={(e) => setField("title", e.target.value)} required className="input" /></Field>
                <Field label="Game"><input value={form.game} onChange={(e) => setField("game", e.target.value)} list="game-list" required className="input" /><datalist id="game-list">{games.map(g => <option value={g} key={g} />)}</datalist></Field>
                <Field label="Kategori / Rank"><input value={form.category} onChange={(e) => setField("category", e.target.value)} className="input" /></Field>
                <Field label="Harga normal"><input value={form.price} onChange={(e) => setField("price", e.target.value)} type="number" required className="input" /></Field>
                <Field label="Deskripsi"><textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={4} className="input" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Status"><select value={form.status} onChange={(e) => setField("status", e.target.value)} className="input"><option value="available">available</option><option value="sold">sold</option><option value="hidden">hidden</option></select></Field>
                  <Field label="Featured"><select value={String(form.featured)} onChange={(e) => setField("featured", e.target.value === "true")} className="input"><option value="false">Tidak</option><option value="true">Ya</option></select></Field>
                </div>
                <Field label="Tags, pisah koma"><input value={form.tags} onChange={(e) => setField("tags", e.target.value)} placeholder="skin langka, murah, full akses" className="input" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Diskon %"><input value={form.discount_percent} onChange={(e) => setField("discount_percent", e.target.value)} type="number" min="0" max="90" className="input" /></Field>
                  <Field label="Promo sampai"><input value={form.promo_ends_at} onChange={(e) => setField("promo_ends_at", e.target.value)} type="datetime-local" className="input" /></Field>
                </div>
                <Field label="Judul promo"><input value={form.promo_title} onChange={(e) => setField("promo_title", e.target.value)} placeholder="Flash Sale" className="input" /></Field>
                <Field label="WA khusus produk"><input value={form.whatsapp_number} onChange={(e) => setField("whatsapp_number", e.target.value)} placeholder="628xxx, kosong = WA store" className="input" /></Field>
                <Field label="Gambar produk, maksimal 8"><input onChange={(e) => setFiles(e.target.files)} type="file" accept="image/*" multiple className="input" /></Field>
              </div>
              <div className="mt-6 flex gap-3">
                <button disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-3 font-black text-white disabled:opacity-60"><Save size={18} /> Simpan</button>
                {form.id && <button type="button" onClick={() => { setForm(emptyForm); setFiles(null); }} className="rounded-2xl border border-stone-300 px-4 py-3 font-black">Batal</button>}
              </div>
            </form>

            <div className="space-y-4">
              {products.map((p) => (
                <article key={p.id} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-stone-200">
                  <div className="flex gap-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone-200">
                      {p.images?.[0]?.image_url ? <img src={p.images[0].image_url} alt={p.title} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2 text-xs font-black">
                        <span className="rounded-full bg-stone-100 px-3 py-1">{p.game}</span>
                        <span className="rounded-full bg-stone-100 px-3 py-1">{p.status}</span>
                        {p.featured && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Unggulan</span>}
                        {p.discount_percent ? <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">-{p.discount_percent}%</span> : null}
                      </div>
                      <h3 className="mt-2 text-xl font-black">{p.title}</h3>
                      <p className="text-sm text-stone-500">{p.category}</p>
                      <p className="mt-2 font-black">{money(p.price)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => editProduct(p)} className="flex-1 rounded-2xl bg-stone-950 px-4 py-3 font-black text-white">Edit</button>
                    <button onClick={() => deleteProduct(p.id)} className="rounded-2xl border border-red-200 px-4 py-3 font-black text-red-700"><Trash2 size={18} /></button>
                  </div>
                </article>
              ))}
              {!products.length && <div className="rounded-[2rem] bg-white p-8 text-stone-500 ring-1 ring-stone-200">Belum ada produk.</div>}
            </div>
          </div>
        ) : (
          <form onSubmit={saveSettings} className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <h2 className="mb-5 text-2xl font-black">Setting Store</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama store"><input value={settings.store_name} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })} className="input" /></Field>
              <Field label="Badge kecil"><input value={settings.badge_text} onChange={(e) => setSettings({ ...settings, badge_text: e.target.value })} className="input" /></Field>
              <Field label="Headline"><input value={settings.headline} onChange={(e) => setSettings({ ...settings, headline: e.target.value })} className="input" /></Field>
              <Field label="Hero note"><input value={settings.hero_note} onChange={(e) => setSettings({ ...settings, hero_note: e.target.value })} className="input" /></Field>
              <Field label="WhatsApp utama"><input value={settings.whatsapp_number} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} className="input" /></Field>
              <Field label="Footer"><input value={settings.footer_text} onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })} className="input" /></Field>
              <Field label="Deskripsi"><textarea value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} rows={4} className="input" /></Field>
              <Field label="Notice promo"><textarea value={settings.notice_text} onChange={(e) => setSettings({ ...settings, notice_text: e.target.value })} rows={4} className="input" /></Field>
            </div>
            <button disabled={loading} className="mt-6 rounded-2xl bg-stone-950 px-6 py-3 font-black text-white disabled:opacity-60">Simpan Setting</button>
          </form>
        )}
      </section>
      <style jsx>{`.input{width:100%;border:1px solid #d6d3d1;border-radius:1rem;padding:.8rem 1rem;background:white;outline:none}.input:focus{box-shadow:0 0 0 2px #1c1917}`}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-black text-stone-600">{label}</span>{children}</label>;
      }
