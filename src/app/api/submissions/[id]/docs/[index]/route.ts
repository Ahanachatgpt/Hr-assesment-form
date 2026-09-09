import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSession } from "@/lib/auth";
import { store, UPLOAD_DIR } from "@/lib/store";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string; index: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, index } = await ctx.params;
  const sub = await store.submissionById(id);
  const doc = sub?.extraDocs?.[Number(index)];
  if (!doc?.path) return NextResponse.json({ error: "No document" }, { status: 404 });
  const filePath = path.join(UPLOAD_DIR, "docs", path.basename(doc.path));
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: "File missing" }, { status: 404 });
  const buf = fs.readFileSync(filePath);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": doc.mime || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${doc.name || "document"}"`,
    },
  });
}
