import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { store, UPLOAD_DIR, ensureDirs } from "@/lib/store";
import { generateSubmissionPdf } from "@/lib/pdf";
import { sendSubmissionEmail, smtpReady } from "@/lib/mail";
import { FormField, Submission } from "@/lib/types";
import { isPhotoField, isResumeField, isMobileField, isEmergencyMobileField, mobileDigits, uid } from "@/lib/utils";

const ALLOWED_EXT = [".pdf", ".doc", ".docx", ".html", ".htm", ".rtf", ".txt", ".odt", ".jpg", ".jpeg", ".png"];
const PHOTO_EXT = [".jpg", ".jpeg", ".png"];
const MAX_BYTES = 10 * 1024 * 1024;

function findField(fields: FormField[], pred: (f: FormField) => boolean): FormField | undefined {
  for (const f of fields) {
    if (pred(f)) return f;
    if (f.repeaterFields) {
      const inner = findField(f.repeaterFields, pred);
      if (inner) return inner;
    }
  }
}

function valueOf(answers: Record<string, unknown>, fields: FormField[], pred: (f: FormField) => boolean) {
  const f = findField(fields, pred);
  if (!f) return "";
  const v = answers[f.id];
  return v == null ? "" : String(v);
}

async function saveUpload(file: File, folder: "resumes" | "photos" | "docs", prefix: string) {
  const ext = path.extname(file.name || "").toLowerCase();
  const stored = `${uid(prefix)}${ext}`;
  const dest = path.join(UPLOAD_DIR, folder, stored);
  fs.writeFileSync(dest, Buffer.from(await file.arrayBuffer()));
  return { stored, name: file.name, mime: file.type || "application/octet-stream" };
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const form = await store.formBySlug(slug);
  if (!form || form.status !== "published") {
    return NextResponse.json({ error: "This form is not available." }, { status: 404 });
  }

  const fd = await req.formData();
  const rawAnswers = fd.get("answers");
  if (typeof rawAnswers !== "string") {
    return NextResponse.json({ error: "Missing answers" }, { status: 400 });
  }
  const answers = JSON.parse(rawAnswers) as Record<string, unknown>;

  for (const field of form.fields) {
    if (field.type === "section" || field.type === "file") continue;
    if (isMobileField(field)) {
      const digits = mobileDigits(answers[field.id]);
      if (field.required && digits.length === 0) {
        return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 });
      }
      if (digits.length > 0 && digits.length !== 10) {
        return NextResponse.json({ error: `${field.label} must be exactly 10 digits.` }, { status: 400 });
      }
      if (field.required && digits.length !== 10) {
        return NextResponse.json({ error: `${field.label} must be exactly 10 digits.` }, { status: 400 });
      }
      continue;
    }
    if (!field.required) continue;
    const v = answers[field.id];
    const empty =
      v == null ||
      v === "" ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === "object" &&
        !Array.isArray(v) &&
        "answer" in (v as object) &&
        !String((v as { answer?: string }).answer ?? "").trim());
    if (empty) {
      return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 });
    }
  }

  const primaryMobile = form.fields.find((f) => isMobileField(f) && !isEmergencyMobileField(f));
  const emergencyMobile = form.fields.find(isEmergencyMobileField);
  if (primaryMobile && emergencyMobile) {
    const a = mobileDigits(answers[primaryMobile.id]);
    const b = mobileDigits(answers[emergencyMobile.id]);
    if (a.length === 10 && b.length === 10 && a === b) {
      return NextResponse.json(
        { error: "Mobile number and emergency number cannot be the same." },
        { status: 400 }
      );
    }
  }

  ensureDirs();
  let resumePath: string | undefined;
  let resumeName: string | undefined;
  let resumeMime: string | undefined;
  let photoPath: string | undefined;
  let photoName: string | undefined;
  const extraDocs: { path: string; name: string; mime: string }[] = [];

  for (const field of form.fields.filter((f) => f.type === "file")) {
    const uploadedList = fd
      .getAll(`file_${field.id}`)
      .concat(isResumeField(field) ? fd.getAll("resume") : [])
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (field.required && uploadedList.length === 0) {
      return NextResponse.json({ error: `Please attach ${field.label}.` }, { status: 400 });
    }

    const names: string[] = [];
    for (const uploaded of uploadedList) {
      if (uploaded.size > MAX_BYTES) {
        return NextResponse.json({ error: `${field.label} must be 10 MB or smaller.` }, { status: 400 });
      }
      const ext = path.extname(uploaded.name || "").toLowerCase();
      if (isPhotoField(field)) {
        if (!PHOTO_EXT.includes(ext)) {
          return NextResponse.json({ error: "Photograph must be JPG or PNG." }, { status: 400 });
        }
        const saved = await saveUpload(uploaded, "photos", "ph");
        photoPath = saved.stored;
        photoName = saved.name;
        names.push(saved.name);
        break;
      }
      if (!ALLOWED_EXT.includes(ext)) {
        return NextResponse.json(
          { error: `${field.label} must be PDF, Word, HTML, RTF, TXT, ODT or an image.` },
          { status: 400 }
        );
      }
      if (isResumeField(field)) {
        const saved = await saveUpload(uploaded, "resumes", "cv");
        resumePath = saved.stored;
        resumeName = saved.name;
        resumeMime = saved.mime;
        names.push(saved.name);
        break;
      }
      const saved = await saveUpload(uploaded, "docs", "doc");
      extraDocs.push({ path: saved.stored, name: saved.name, mime: saved.mime });
      names.push(saved.name);
    }
    if (names.length) answers[field.id] = names.length === 1 ? names[0] : names;
  }

  const candidateName =
    valueOf(answers, form.fields, (f) => /^name$/i.test(f.label) || /name as per/i.test(f.label) || /full name/i.test(f.label)) ||
    "Candidate";
  const candidateEmail = valueOf(answers, form.fields, (f) => f.type === "email" || /email/i.test(f.label));
  const candidatePhone = valueOf(
    answers,
    form.fields,
    (f) => f.type === "tel" && /emergency/i.test(f.label) === false
  );

  const settings = await store.settings();
  const sub: Submission = {
    id: uid("sub"),
    formId: form.id,
    formTitle: form.title,
    formSlug: form.slug,
    candidateName,
    candidateEmail,
    candidatePhone,
    answers,
    resumePath,
    resumeName,
    resumeMime,
    photoPath,
    photoName,
    extraDocs: extraDocs.length ? extraDocs : undefined,
    emailStatus: "pending",
    createdAt: new Date().toISOString(),
  };

  try {
    const pdfPath = await generateSubmissionPdf(form, sub, settings);
    sub.pdfPath = pdfPath;
    const destEmail = form.notifyEmail || settings.notifyEmail;
    if (!smtpReady({ ...settings, notifyEmail: destEmail })) {
      sub.emailStatus = "not_configured";
      sub.emailError = "SMTP or notification email is not configured. Submission is saved; send later from admin.";
    } else {
      const resumeAbs = resumePath ? path.join(UPLOAD_DIR, "resumes", resumePath) : undefined;
      const extraAbs = extraDocs
        .filter((d) => d.path)
        .map((d) => ({ filename: d.name, path: path.join(UPLOAD_DIR, "docs", d.path) }));
      const result = await sendSubmissionEmail({
        settings: { ...settings, notifyEmail: destEmail },
        submission: sub,
        pdfPath,
        resumePath: resumeAbs,
        extraAttachments: extraAbs,
        to: destEmail,
      });
      sub.emailStatus = result.ok ? "sent" : "failed";
      sub.emailError = result.error;
      sub.emailedTo = result.to;
    }
  } catch (e) {
    sub.emailStatus = "failed";
    sub.emailError = e instanceof Error ? e.message : "Failed to generate PDF or send email";
  }

  await store.addSubmission(sub);
  return NextResponse.json({ ok: true, id: sub.id, emailStatus: sub.emailStatus });
}
