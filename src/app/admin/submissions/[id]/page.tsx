"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AssessmentForm, Submission } from "@/lib/types";
import { answerPreview, followUpHeading, formatDate, isCertificateField, isPhotoField, isResumeField, padRepeaterRows, yesNoChoice } from "@/lib/utils";
import { EmailBadge } from "@/components/EmailBadge";
import { HrReviewForm } from "@/components/HrReviewForm";

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sub, setSub] = useState<Submission | null>(null);
  const [form, setForm] = useState<AssessmentForm | null>(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/submissions/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setSub(d.submission);
        setForm(d.form);
      });
  }, [id]);

  if (!sub) return <p className="text-navy-600">Loading submission…</p>;

  async function resend() {
    setBusy("resend");
    const res = await fetch(`/api/submissions/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend" }),
    });
    const data = await res.json();
    setSub(data);
    setBusy("");
  }

  async function remove() {
    if (!confirm("Delete this submission?")) return;
    await fetch(`/api/submissions/${id}`, { method: "DELETE" });
    router.push("/admin/submissions");
  }

  return (
    <div>
      <Link href="/admin/submissions" className="text-sm text-navy-600 hover:underline">
        ← Submissions
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{sub.candidateName}</h1>
          <p className="text-sm text-navy-600">
            {sub.formTitle} · {formatDate(sub.createdAt)}
          </p>
        </div>
        {sub.photoPath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/submissions/${id}/photo`}
            alt={sub.candidateName}
            className="h-28 w-24 rounded-md border border-navy-200 object-cover"
          />
        )}
        <div className="flex flex-wrap gap-2">
          <a className="btn-primary" href={`/api/submissions/${id}/pdf`}>
            Download PDF
          </a>
          {sub.resumePath && (
            <a className="btn-secondary" href={`/api/submissions/${id}/resume`}>
              Download resume
            </a>
          )}
          {(sub.extraDocs || []).map((doc, i) => (
            <a key={doc.path} className="btn-secondary" href={`/api/submissions/${id}/docs/${i}`}>
              Download {doc.name}
            </a>
          ))}
          <button className="btn-secondary" onClick={resend} disabled={busy === "resend"}>
            {busy === "resend" ? "Sending…" : "Email PDF + attachments"}
          </button>
          <button className="btn-ghost text-red-700" onClick={remove}>
            Delete
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs uppercase text-navy-500">Email</p>
          <p className="mt-1 font-medium">{sub.candidateEmail || "—"}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase text-navy-500">Phone</p>
          <p className="mt-1 font-medium">{sub.candidatePhone || "—"}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase text-navy-500">Delivery</p>
          <div className="mt-1">
            <EmailBadge status={sub.emailStatus} />
          </div>
          {sub.emailError && <p className="mt-2 text-xs text-navy-500">{sub.emailError}</p>}
          {sub.emailedTo && <p className="mt-1 text-xs text-navy-500">Sent to {sub.emailedTo}</p>}
        </div>
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="border-b border-navy-100 px-5 py-3 font-semibold">Filled answers</div>
        <dl>
          {(form?.fields || []).map((f) => (
              <div key={f.id} className="grid gap-1 border-t border-navy-50 px-5 py-3 md:grid-cols-[220px_1fr]">
                {f.type === "section" ? (
                  <dt className="font-display text-lg text-navy-900 md:col-span-2">{f.label}</dt>
                ) : (
                  <>
                    <dt className="text-sm font-medium text-navy-500">{f.label}</dt>
                    <dd className="text-sm text-navy-900">
                      {f.type === "repeater" ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full border-collapse text-left text-sm">
                            <thead>
                              <tr>
                                {(f.repeaterFields || []).map((rf) => (
                                  <th key={rf.id} className="border-b border-navy-100 pb-1 pr-3 text-xs font-semibold uppercase tracking-wide text-navy-500">
                                    {rf.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {padRepeaterRows(f, sub.answers[f.id]).map((row, i) => (
                                <tr key={i}>
                                  {(f.repeaterFields || []).map((rf) => (
                                    <td key={rf.id} className="border-b border-navy-50 py-1.5 pr-3 align-top">
                                      {answerPreview(row[rf.id])}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : f.type === "file" ? (
                        isResumeField(f)
                          ? sub.resumeName || "—"
                          : isCertificateField(f)
                            ? (sub.extraDocs || []).map((d) => d.name).join(", ") || "—"
                            : isPhotoField(f)
                              ? sub.photoName || "—"
                              : answerPreview(sub.answers[f.id])
                      ) : f.type === "yesno" && f.followUpWhen ? (
                        <div className="space-y-1">
                          <p>{yesNoChoice(sub.answers[f.id]) || "—"}</p>
                          <p>
                            <span className="text-navy-500">{followUpHeading(f)}: </span>
                            {answerPreview(
                              sub.answers[f.id] && typeof sub.answers[f.id] === "object"
                                ? (sub.answers[f.id] as { details?: string }).details
                                : ""
                            )}
                          </p>
                        </div>
                      ) : f.type === "textarea" ? (
                        <p className="whitespace-pre-wrap break-words">
                          {String(sub.answers[f.id] ?? "").trim() ? String(sub.answers[f.id]) : "—"}
                        </p>
                      ) : (
                        answerPreview(sub.answers[f.id])
                      )}
                    </dd>
                  </>
                )}
              </div>
            ))}
        </dl>
      </div>

      <HrReviewForm submission={sub} onSaved={setSub} />
    </div>
  );
}
