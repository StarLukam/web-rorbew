import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adicoran",
  description: "Store akun game simpel, rapi, dan cepat.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
