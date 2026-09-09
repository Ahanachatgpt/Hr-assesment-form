import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSession } from "@/lib/auth";
import { store, UPLOAD_DIR } from "@/lib/store";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const sub = await store.submissionById(id);
  if (!sub?.photoPath) return NextResponse.json({ error: "No photo" }, { status: 404 });
  const filePath = path.join(UPLOAD_DIR, "photos", path.basename(sub.photoPath));
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: "File missing" }, { status: 404 });
  const buf = fs.readFileSync(filePath);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `inline; filename="${sub.photoName || "photo.jpg"}"`,
    },
  });
}
