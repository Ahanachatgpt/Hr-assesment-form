import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getSession } from "@/lib/auth";
import { store, UPLOAD_DIR } from "@/lib/store";
import { generateSubmissionPdf } from "@/lib/pdf";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const sub = await store.submissionById(id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const form = await store.formById(sub.formId);
  const settings = await store.settings();
  if (!form) return NextResponse.json({ error: "Form missing" }, { status: 400 });

  const pdfPath = await generateSubmissionPdf(form, sub, settings);
  await store.updateSubmission(id, { pdfPath });
  const buf = fs.readFileSync(pdfPath);
  const filename = `${sub.candidateName.replace(/\s+/g, "_")}_Assessment.pdf`;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
