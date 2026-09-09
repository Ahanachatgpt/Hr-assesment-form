"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AssessmentForm, FormField } from "@/lib/types";
import { buildFormSteps } from "@/lib/formSteps";
import { fieldError, hasEmploymentExperience, isEmploymentField, isMobileField, isMultiFileField, isPhotoField, isRolesField, validateAnswers } from "@/lib/utils";
import { FieldControl } from "./FieldControl";
import { AhanaLogo } from "./AhanaLogo";

export function PublicForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [company, setCompany] = useState({ name: "", tagline: "", support: "" });
  const [form, setForm] = useState<AssessmentForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);

  useEffect(() => {
    fetch(`/api/public/forms/${slug}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Form not found");
        setForm(data.form);
        setCompany({
          name: data.companyName,
          tagline: data.companyTagline,
          support: data.supportEmail,
        });
        const initial: Record<string, unknown> = {};
        for (const f of data.form.fields as FormField[]) {
          if (f.type === "repeater") {
            if (isEmploymentField(f)) continue;
            initial[f.id] = f.defaultRows?.length ? f.defaultRows.map((row: Record<string, unknown>) => ({ ...row })) : [{}];
          }
          if (f.type === "checkbox") initial[f.id] = [];
        }
        setAnswers(initial);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const steps = useMemo(() => (form ? buildFormSteps(form.fields) : []), [form]);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function visibleFields(list: FormField[]) {
    if (!form) return list;
    return list.filter((field) => {
      if (field.type === "section") return false;
      if (isRolesField(field) && !hasEmploymentExperience(form.fields, answers)) return false;
      return true;
    });
  }

  function updateAnswer(id: string, value: unknown) {
    const nextAnswers = { ...answers, [id]: value };
    const field = form?.fields.find((f) => f.id === id);
    if (field && isEmploymentField(field) && Array.isArray(value) && value.length === 0) {
      const roles = form.fields.find(isRolesField);
      if (roles) nextAnswers[roles.id] = "";
    }
    setAnswers(nextAnswers);
    if (!field) return;
    if (isMobileField(field)) {
      const all = validateAnswers(form.fields, nextAnswers, files);
      setErrors((prev) => {
        const next = { ...prev };
        for (const f of form.fields.filter(isMobileField)) {
          if (all[f.id]) next[f.id] = all[f.id];
          else delete next[f.id];
        }
        return next;
      });
      return;
    }
    const err = fieldError(field, value, files[id]);
    setErrors((prev) => {
      if (!prev[id] && !err) return prev;
      const next = { ...prev };
      if (err) next[id] = err;
      else delete next[id];
      return next;
    });
  }

  function goNext() {
    if (!form || !current) return;
    const nextErrors = validateAnswers(visibleFields(current.fields), answers, files, form.fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setError("Please complete the highlighted fields before continuing.");
      const firstId = current.fields.find((f) => nextErrors[f.id])?.id;
      if (firstId) {
        document.querySelector(`[data-field-id="${firstId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!isLast) {
      goNext();
      return;
    }
    const nextErrors = validateAnswers(form.fields, answers, files);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setError("Please fill the highlighted required fields.");
      const firstId = form.fields.find((f) => nextErrors[f.id])?.id;
      const idx = steps.findIndex((s) => s.fields.some((f) => f.id === firstId));
      if (idx >= 0) setStep(idx);
      if (firstId) {
        setTimeout(() => {
          document.querySelector(`[data-field-id="${firstId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      }
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { ...answers };
      for (const f of form.fields) if (f.type === "file") delete payload[f.id];
      const fd = new FormData();
      fd.set("answers", JSON.stringify(payload));
      for (const [id, list] of Object.entries(files)) {
        for (const file of list) fd.append(`file_${id}`, file);
      }
      const res = await fetch(`/api/public/forms/${slug}/submit`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      router.push(`/apply/${slug}/success`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="py-24 text-center text-navy-600">Loading form…</div>;
  if (!form) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <h1 className="font-display text-3xl">Form unavailable</h1>
        <p className="mt-2 text-navy-600">{error || "This link is not active."}</p>
      </div>
    );
  }

  return (
    <div className="paper-bg min-h-screen pb-16">
      <div className="bg-navy-950 text-white">
        <div className="mx-auto flex w-full max-w-4xl items-start justify-between gap-3 px-4 py-5 sm:gap-4 sm:px-6 sm:py-6">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gold-400 sm:text-xs sm:tracking-[0.22em]">
              {company.name}
            </p>
            <h1 className="form-h1 mt-1.5 text-white">{form.title}</h1>
            <p className="mt-2 text-sm text-navy-200">{form.description}</p>
          </div>
          <AhanaLogo size="lg" className="max-w-[58%] shrink-0 sm:max-w-[300px] md:max-w-[380px]" />
        </div>
      </div>

      <form noValidate onSubmit={onSubmit} className="mx-auto -mt-4 w-full max-w-4xl px-3 sm:px-6">
          <div className="card p-4 sm:p-6 md:p-8">
            {current && (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
                  Step {step + 1} of {steps.length}
                </p>
                <h2 className="form-h2 mt-1">{current.title}</h2>
                <p className="mt-1 text-sm text-navy-500">Complete this section, then continue. Your answers stay saved as you move.</p>
              </>
            )}
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
            )}
            <div className="mt-5 grid grid-cols-12 gap-3 sm:gap-4">
              {current?.fields.map((field) => {
                if (isRolesField(field) && !hasEmploymentExperience(form.fields, answers)) return null;
                if (field.type === "section") return null;
                return field.type === "file" ? (
                  <div
                    key={field.id}
                    data-field-id={field.id}
                    className={isPhotoField(field) ? "col-span-12 min-w-0 sm:col-span-6" : "col-span-12 min-w-0"}
                  >
                    <label className="field-label">
                      {field.label}
                      {field.required && <span className="text-red-600"> *</span>}
                    </label>
                    {field.helpText && <p className="mb-1.5 text-xs text-navy-500">{field.helpText}</p>}
                    <div
                      className={`rounded-xl border border-dashed p-4 ${
                        errors[field.id] ? "border-red-500 bg-red-50" : "border-navy-300 bg-navy-50/60"
                      }`}
                    >
                      {isPhotoField(field) && previews[field.id] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previews[field.id]}
                          alt="Photograph"
                          className="mb-3 h-32 w-28 rounded-md border border-navy-200 object-cover"
                        />
                      )}
                      <input
                        type="file"
                        accept={field.accept}
                        multiple={isMultiFileField(field)}
                        onChange={(e) => {
                          const picked = Array.from(e.target.files || []);
                          if (!picked.length) return;
                          setFiles((prev) => {
                            if (isMultiFileField(field)) {
                              const existing = prev[field.id] || [];
                              const merged = [...existing];
                              for (const file of picked) {
                                if (!merged.some((x) => x.name === file.name && x.size === file.size)) merged.push(file);
                              }
                              return { ...prev, [field.id]: merged };
                            }
                            return { ...prev, [field.id]: [picked[0]] };
                          });
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next[field.id];
                            return next;
                          });
                          if (isPhotoField(field) && picked[0]) {
                            setPreviews((p) => ({ ...p, [field.id]: URL.createObjectURL(picked[0]) }));
                          }
                          e.target.value = "";
                        }}
                        className="block w-full max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />
                      {(files[field.id] || []).length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {(files[field.id] || []).map((file, i) => (
                            <li key={`${file.name}-${file.size}-${i}`} className="flex items-center justify-between gap-2 text-xs text-navy-600">
                              <span className="min-w-0 truncate">
                                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                              </span>
                              <button
                                type="button"
                                className="shrink-0 font-medium text-red-600"
                                onClick={() =>
                                  setFiles((prev) => {
                                    const next = (prev[field.id] || []).filter((_, idx) => idx !== i);
                                    const copy = { ...prev };
                                    if (next.length) copy[field.id] = next;
                                    else delete copy[field.id];
                                    return copy;
                                  })
                                }
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {errors[field.id] && <p className="mt-1.5 text-xs font-medium text-red-600">{errors[field.id]}</p>}
                  </div>
                ) : (
                  <FieldControl
                    key={field.id}
                    field={field}
                    value={answers[field.id]}
                    error={errors[field.id]}
                    onChange={(v) => updateAnswer(field.id, v)}
                    disabled={submitting}
                    hideTitle
                  />
                );
              })}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-navy-100 pt-6 sm:flex-row sm:justify-between">
              <button
                type="button"
                className="btn-secondary w-full sm:w-auto"
                disabled={step === 0 || submitting}
                onClick={() => {
                  setError("");
                  setStep((s) => Math.max(0, s - 1));
                }}
              >
                Back
              </button>
              <button className="btn-primary w-full min-w-0 sm:w-auto sm:min-w-[160px]" disabled={submitting}>
                {submitting ? "Submitting…" : isLast ? "Submit application" : "Continue"}
              </button>
            </div>
          </div>
        <p className="mt-6 text-center text-xs text-navy-500">
          {company.support ? `Questions? ${company.support}` : company.tagline}
        </p>
      </form>
    </div>
  );
}
