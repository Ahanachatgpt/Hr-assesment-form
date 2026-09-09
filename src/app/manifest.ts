import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ahana Hospitals HR Assessment",
    short_name: "Ahana HR",
    description: "Interview assessment and candidate registration for Ahana Hospitals.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f1e8",
    theme_color: "#0c1c32",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
