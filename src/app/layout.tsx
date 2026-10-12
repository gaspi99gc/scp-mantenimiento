import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SCP Mantenimiento", template: "%s | SCP" },
  description: "Vencimientos, visitas e informes de mantenimiento de SCP.",
};

export const viewport: Viewport = {
  themeColor: "#1d2940",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
