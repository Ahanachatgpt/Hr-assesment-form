import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { AppSettings, Submission } from "./types";

export function smtpReady(settings: AppSettings): boolean {
  return Boolean(
    settings.smtpHost &&
      settings.smtpFromEmail &&
      settings.notifyEmail &&
      settings.smtpUser &&
      settings.smtpPass
  );
}

function recipientList(settings: AppSettings, to?: string): string {
  const set = new Set<string>();
  for (const part of [to, settings.notifyEmail, settings.smtpUser]) {
    for (const email of String(part || "").split(/[,;]+/)) {
      const v = email.trim();
      if (v.includes("@")) set.add(v);
    }
  }
  return [...set].join(", ");
}

export async function sendSubmissionEmail(opts: {
  settings: AppSettings;
  submission: Submission;
  pdfPath?: string;
  resumePath?: string;
  extraAttachments?: { filename: string; path: string }[];
  to?: string;
}): Promise<{ ok: boolean; error?: string; to: string }> {
  const { settings, submission } = opts;
  const to = recipientList(settings, opts.to || submission.emailedTo);
  if (!to) return { ok: false, error: "No destination email configured", to: "" };
  if (!settings.smtpHost || !settings.smtpFromEmail || !settings.smtpUser || !settings.smtpPass) {
    return { ok: false, error: "SMTP is not configured", to };
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: settings.smtpSecure || settings.smtpPort === 465,
    auth: settings.smtpUser
      ? { user: settings.smtpUser, pass: settings.smtpPass }
      : undefined,
  });

  const attachments: { filename: string; path: string }[] = [];
  if (opts.pdfPath && fs.existsSync(opts.pdfPath)) {
    attachments.push({
      filename: `${submission.candidateName.replace(/\s+/g, "_")}_Assessment.pdf`,
      path: opts.pdfPath,
    });
  }
  if (opts.resumePath && fs.existsSync(opts.resumePath)) {
    attachments.push({
      filename: submission.resumeName || path.basename(opts.resumePath),
      path: opts.resumePath,
    });
  }
  for (const extra of opts.extraAttachments || []) {
    if (extra.path && fs.existsSync(extra.path)) {
      attachments.push({ filename: extra.filename, path: extra.path });
    }
  }

  const extraNames = (opts.extraAttachments || [])
    .map((d) => d.filename)
    .filter(Boolean)
    .join(", ");

  await transporter.sendMail({
    from: `"${settings.smtpFromName || settings.companyName}" <${settings.smtpFromEmail}>`,
    to,
    subject: `New assessment: ${submission.candidateName} — ${submission.formTitle}`,
    text: [
      `A new HR assessment form has been submitted.`,
      ``,
      `Candidate: ${submission.candidateName}`,
      `Email: ${submission.candidateEmail}`,
      `Phone: ${submission.candidatePhone || "—"}`,
      `Form: ${submission.formTitle}`,
      `Submitted: ${new Date(submission.createdAt).toLocaleString("en-IN")}`,
      ``,
      `The filled form is attached as PDF.`,
      submission.resumeName ? `The candidate resume is attached as a separate file (${submission.resumeName}).` : "No resume was attached.",
      extraNames ? `Supporting documents attached: ${extraNames}.` : "",
    ].join("\n"),
    html: `
      <div style="font-family:Georgia,serif;color:#142e4e;line-height:1.5">
        <h2 style="margin:0 0 8px">New assessment received</h2>
        <p style="margin:0 0 16px;color:#5b6b7c">A candidate submitted <strong>${escapeHtml(submission.formTitle)}</strong>.</p>
        <table style="border-collapse:collapse;width:100%;max-width:520px">
          ${row("Candidate", submission.candidateName)}
          ${row("Email", submission.candidateEmail)}
          ${row("Phone", submission.candidatePhone || "—")}
          ${row("Submitted", new Date(submission.createdAt).toLocaleString("en-IN"))}
        </table>
        <p style="margin:16px 0 0">The filled form is attached as a <strong>PDF</strong>.${
          submission.resumeName
            ? ` The original resume (<strong>${escapeHtml(submission.resumeName)}</strong>) is attached.`
            : ""
        }${
          extraNames
            ? ` Supporting documents (<strong>${escapeHtml(extraNames)}</strong>) are also attached.`
            : ""
        }</p>
      </div>
    `,
    attachments,
  });

  return { ok: true, to };
}

export async function sendTestEmail(settings: AppSettings, to: string) {
  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: settings.smtpSecure || settings.smtpPort === 465,
    auth: settings.smtpUser
      ? { user: settings.smtpUser, pass: settings.smtpPass }
      : undefined,
  });
  await transporter.sendMail({
    from: `"${settings.smtpFromName || settings.companyName}" <${settings.smtpFromEmail}>`,
    to,
    subject: "HR Assessment — test email",
    text: "SMTP is configured correctly. Future form submissions will be delivered to this mailbox with PDF + resume attachments.",
  });
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 10px;border:1px solid #e5e7eb;background:#f8fafc;width:140px">${escapeHtml(label)}</td>
    <td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(value)}</td>
  </tr>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
