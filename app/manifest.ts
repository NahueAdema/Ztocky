import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ztocky — Gestión inteligente de stock y compras",
    short_name: "Ztocky",
    description:
      "Sistema inteligente de gestión de compras y stock. Analiza ventas, proyecta agotamientos y automatiza el reabastecimiento.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0f14",
    theme_color: "#038786",
    categories: ["business", "shopping", "productivity"],
    lang: "es",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
