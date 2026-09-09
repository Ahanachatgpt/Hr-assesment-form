import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getSession } from "@/lib/auth";
import { store, UPLOAD_DIR } from "@/lib/store";
import { generateSubmissionPdf } from "@/lib/pdf";
import { sendSubmissionEmail } from "@/lib/mail";

async function guard() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const sub = await store.submissionById(id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const form = await store.formById(sub.formId);
  return NextResponse.json({ submission: sub, form });
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  await store.deleteSubmission(id);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
    const { action, hrReview } = await req.json();
  const sub = await store.submissionById(id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const form = await store.formById(sub.formId);
  const settings = await store.settings();

  if (action === "resend") {
    if (!form) return NextResponse.json({ error: "Form missing" }, { status: 400 });
    try {
      const pdfPath = await generateSubmissionPdf(form, sub, settings);
      const resumePath = sub.resumePath
        ? path.join(UPLOAD_DIR, "resumes", path.basename(sub.resumePath))
        : undefined;
      const extraAttachments = (sub.extraDocs || []).map((d) => ({
        filename: d.name,
        path: path.join(UPLOAD_DIR, "docs", path.basename(d.path)),
      }));
      const result = await sendSubmissionEmail({
        settings,
        submission: sub,
        pdfPath,
        resumePath,
        extraAttachments,
        to: form.notifyEmail || settings.notifyEmail,
      });
      const updated = await store.updateSubmission(id, {
        pdfPath,
        emailStatus: result.ok ? "sent" : "failed",
        emailError: result.error,
        emailedTo: result.to,
      });
      return NextResponse.json(updated);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Email failed";
      const updated = await store.updateSubmission(id, { emailStatus: "failed", emailError: msg });
      return NextResponse.json(updated, { status: 500 });
    }
  }

  if (action === "hr-review") {
    const updated = await store.updateSubmission(id, {
      hrReview: { ...hrReview, updatedAt: new Date().toISOString() },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
