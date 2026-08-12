import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pier7 Eventos",
  description: "Gerenciamento de eventos, inscrições e participantes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
