import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Encabezados de seguridad para todas las páginas: no se puede meter la app en un marco de otra web
  // (clickjacking), el navegador no adivina tipos de archivo y no se filtran direcciones internas.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
