export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at?: string;
};

export type Product = {
  id: string;
  title: string;
  game: string;
  category: string | null;
  price: number;
  description: string | null;
  status: "available" | "sold" | string;
  featured: boolean | null;
  discount_percent: number | null;
  promo_ends_at: string | null;
  whatsapp_number: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at?: string | null;
  images?: ProductImage[];
};

export type StoreSettings = {
  id: number;
  store_name: string;
  badge_text: string;
  headline: string;
  description: string;
  whatsapp_number: string;
  notice_text: string;
  hero_note: string;
  footer_text: string;
  trust_text?: string | null;
  created_at?: string;
  updated_at?: string;
};
