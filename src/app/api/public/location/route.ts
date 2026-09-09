import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = (forwarded ? forwarded.split(",")[0] : realIp || "").trim();

    // If local or private IP, fetch public IP geolocation
    const isLocal = !ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.");
    const url = isLocal ? "https://ipapi.co/json/" : `https://ipapi.co/${ip}/json/`;

    const res = await fetch(url, {
      headers: { "User-Agent": "AhanaHR/1.0" },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const parts = [data.city, data.region].filter(Boolean);
      const location = parts.join(", ") || data.country_name || "";
      if (location) {
        return NextResponse.json({ location, city: data.city, region: data.region });
      }
    }
  } catch {
    // Fallback silently
  }

  return NextResponse.json({ location: "" });
}
