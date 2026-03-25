import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/shared/components/layout/Navigation";

export const metadata: Metadata = {
  title: "NARRAVIA - Narrative AI Video Intelligence",
  description: "Convierte tu historia en un video narrado con imágenes generadas por IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <Navigation />
        {children}
      </body>
    </html>
  );
}