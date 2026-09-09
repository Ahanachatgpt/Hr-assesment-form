import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server must accept phones/PCs on LAN and share links (not only localhost).
  allowedDevOrigins: [
    "192.168.0.9",
    "100.118.12.7",
    "127.0.0.1",
    "localhost",
    "Maha-kannan",
    "*.trycloudflare.com",
    "*.loca.lt",
  ],
  serverExternalPackages: ["pdfkit", "nodemailer"],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
