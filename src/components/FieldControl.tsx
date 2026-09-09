"use client";

import { FormField } from "@/lib/types";
import { isEmploymentField, isMobileField, mobileDigits, selectChoice, showSelectNotes, yesNoChoice } from "@/lib/utils";
import { DateDropdowns } from "./DateDropdowns";

interface Props {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  error?: string;
  hideTitle?: boolean;
}

function widthClass(width?: string, type?: string) {
  if (type === "date") {
    if (width === "third") return "col-span-12 min-w-0 md:col-span-4";
    return "col-span-12 min-w-0 sm:col-span-6";
  }
  if (width === "half") return "col-span-12 min-w-0 sm:col-span-6";
  if (width === "third") return "col-span-12 min-w-0 md:col-span-4";
  if (width === "quarter") return "col-span-12 min-w-0 sm:col-span-6 md:col-span-2";
  return "col-span-12 min-w-0";
}

export function FieldControl({ field, value, onChange, disabled, error, hideTitle }: Props) {
  if (field.type === "section") {
    if (hideTitle) return null;
    return (
      <div className="form-section">
        <h2 className="form-h2">{field.label}</h2>
        {field.helpText && <p className="mt-1 text-sm text-navy-500">{field.helpText}</p>}
      </div>
    );
  }

  const required = field.required ? <span className="text-red-600"> *</span> : null;
  const digits = isMobileField(field) ? mobileDigits(value) : "";
  const mobileLiveError =
    isMobileField(field) && digits.length > 0 && digits.length !== 10
      ? "Enter exactly 10 digits."
      : "";
  const shownError = error || mobileLiveError;

  if (field.type === "repeater") {
    const isEmployment = isEmploymentField(field);
    const choseExperience = Array.isArray(value) && (value as unknown[]).length > 0;
    const choseFresher = Array.isArray(value) && (value as unknown[]).length === 0;
    const rows = choseExperience
      ? (value as Record<string, unknown>[])
      : isEmployment
        ? []
        : Array.isArray(value)
          ? (value as Record<string, unknown>[])
          : [{}];
    const showEntries = !isEmployment || choseExperience;
    const entryRows = showEntries ? (rows.length ? rows : [{}]) : [];

    return (
      <div className={hideTitle ? "col-span-12 min-w-0" : "form-section"} data-field-id={field.id}>
        {!hideTitle && (
        <div className="min-w-0">
          <h2 className="form-h2">
            {field.label}
            {required}
          </h2>
          {!isEmployment && field.helpText && <p className="mt-1 text-xs text-navy-500">{field.helpText}</p>}
        </div>
        )}

        {isEmployment && (
          <div className={hideTitle ? "" : "mt-4"}>
            <p className="form-h3 field-label">Do you have work experience?</p>
            <div className="mt-2 flex flex-wrap gap-3" role="group" aria-label="Do you have work experience?">
              {(["Yes", "No"] as const).map((choice) => {
                const selected = choice === "Yes" ? choseExperience : choseFresher;
                return (
                  <button
                    key={choice}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(choice === "Yes" ? (choseExperience ? value : [{}]) : [])}
                    className={`min-w-[5.5rem] rounded-lg border px-5 py-2.5 text-sm font-semibold transition ${
                      selected
                        ? "border-navy-800 bg-navy-800 text-white shadow-sm"
                        : "border-navy-200 bg-white text-navy-800 hover:border-navy-400 hover:bg-navy-50"
                    }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isEmployment && choseFresher && (
          <div className="mt-4 rounded-xl border border-navy-200 bg-navy-50 px-4 py-4 text-sm leading-relaxed text-navy-700">
            <p className="font-semibold text-navy-900">Recorded as Fresher</p>
            <p className="mt-1">You selected No. Employment details are not required for this application.</p>
          </div>
        )}

        {showEntries && (
          <>
            <div className="mt-3 space-y-4">
              {entryRows.map((row, i) => (
                <div key={i} className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                  {entryRows.length > 1 && (
                    <div className="mb-3 flex justify-end">
                      <button
                        type="button"
                        className="text-xs font-medium text-red-600"
                        onClick={() => onChange(entryRows.filter((_, idx) => idx !== i))}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <div className="grid min-w-0 grid-cols-12 gap-3">
                    {(field.repeaterFields || []).map((rf) => (
                      <FieldControl
                        key={rf.id}
                        field={rf}
                        value={row[rf.id]}
                        onChange={(v) => {
                          const next = entryRows.map((r, idx) => (idx === i ? { ...r, [rf.id]: v } : r));
                          onChange(next);
                        }}
                        disabled={disabled}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-secondary mt-3"
              onClick={() => onChange([...entryRows, {}])}
              disabled={disabled}
            >
              + Add another
            </button>
          </>
        )}
        {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className={widthClass(field.width, field.type)} data-field-id={field.id}>
      <label
        className={`form-h3 field-label ${
          field.width && field.width !== "full" ? "md:flex md:min-h-[2.5rem] md:items-end" : ""
        }`}
      >
        {field.label}
        {required}
      </label>
      {field.helpText && <p className="mb-1.5 text-xs text-navy-500">{field.helpText}</p>}
      <ControlInner field={field} value={value} onChange={onChange} disabled={disabled} error={shownError} />
      {shownError && <p className="mt-1.5 text-xs font-medium text-red-600">{shownError}</p>}
    </div>
  );
}

function invalidClass(on: boolean) {
  return on
    ? "!border-red-500 !bg-red-50 !text-red-800 ring-2 !ring-red-200 focus:!border-red-500 focus:!ring-red-200"
    : undefined;
}

function ControlInner({ field, value, onChange, disabled, error }: Props) {
  const common = { disabled, placeholder: field.placeholder };
  const invalid = Boolean(error);

  if (field.type === "textarea") {
    return (
      <textarea
        {...common}
        className={invalidClass(invalid)}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (field.type === "select") {
    const answer = selectChoice(value);
    const details =
      value && typeof value === "object" && !Array.isArray(value)
        ? String((value as { details?: string }).details ?? "")
        : "";
    const notesOn = showSelectNotes(field, answer);
    const usesNotes = Boolean(field.followUpExcept || field.followUpLabel);
    return (
      <div>
        <select
          value={answer}
          onChange={(e) => {
            const next = e.target.value;
            if (!usesNotes) {
              onChange(next);
              return;
            }
            const keepNotes = showSelectNotes(field, next);
            onChange(next ? { answer: next, details: keepNotes ? details : "" } : "");
          }}
          disabled={disabled}
          className={invalidClass(invalid)}
        >
          <option value="">Select…</option>
          {(field.options || []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {notesOn && (
          <div className="mt-2 min-w-0">
            <label className="field-label">{field.followUpLabel || "Note / details"}</label>
            <input
              type="text"
              className="w-full min-w-0"
              disabled={disabled}
              placeholder={field.followUpPlaceholder || "Add details"}
              value={details}
              onChange={(e) => onChange({ answer, details: e.target.value })}
            />
          </div>
        )}
      </div>
    );
  }
  if (field.type === "radio") {
    return (
      <div className={`flex flex-wrap gap-3 rounded-lg p-1 ${invalid ? "ring-2 ring-red-300" : ""}`}>
        {(field.options || []).map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm">
            <input type="radio" checked={value === o} onChange={() => onChange(o)} disabled={disabled} />
            {o}
          </label>
        ))}
      </div>
    );
  }
  if (field.type === "checkbox") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className={`space-y-2 rounded-lg p-1 ${invalid ? "ring-2 ring-red-300" : ""}`}>
        {(field.options || []).map((o) => (
          <label key={o} className="flex items-start gap-2 text-sm leading-relaxed">
            <input
              type="checkbox"
              className="mt-1 shrink-0"
              checked={selected.includes(o)}
              onChange={(e) =>
                onChange(e.target.checked ? [...selected, o] : selected.filter((x) => x !== o))
              }
              disabled={disabled}
            />
            <span className="min-w-0">{o}</span>
          </label>
        ))}
      </div>
    );
  }
  if (field.type === "yesno") {
    const answer = yesNoChoice(value);
    const details =
      value && typeof value === "object" && !Array.isArray(value)
        ? String((value as { details?: string }).details ?? "")
        : "";
    const showFollowUp = Boolean(field.followUpWhen) && answer === (field.followUpWhen || "Yes");
    return (
      <div>
        <div className={`flex flex-wrap gap-3 rounded-lg p-1 ${invalid ? "ring-2 ring-red-300" : ""}`}>
          {["Yes", "No"].map((o) => (
            <button
              key={o}
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange(
                  field.followUpWhen
                    ? { answer: o, details: o === field.followUpWhen ? details : "" }
                    : o
                )
              }
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                answer === o ? "border-navy-800 bg-navy-800 text-white" : "border-navy-200 bg-white"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        {showFollowUp && (
          <div className="mt-2 min-w-0">
            {field.followUpLabel && <label className="field-label">{field.followUpLabel}</label>}
            <input
              type="text"
              className="w-full min-w-0"
              disabled={disabled}
              placeholder={field.followUpPlaceholder || "Optional details"}
              value={details}
              onChange={(e) => onChange({ answer, details: e.target.value })}
            />
          </div>
        )}
      </div>
    );
  }
  if (field.type === "file") {
    return (
      <input
        type="file"
        disabled={disabled}
        accept={field.accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
      />
    );
  }

  if (field.type === "date") {
    return (
      <DateDropdowns
        value={value}
        onChange={onChange}
        disabled={disabled}
        error={invalid}
        label={field.label}
        compact={field.width === "third"}
      />
    );
  }

  if (isMobileField(field)) {
    return (
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={15}
        disabled={disabled}
        placeholder={field.placeholder || "10-digit mobile number"}
        className={`${invalid ? "field-invalid " : ""}${invalidClass(invalid) || ""}`.trim() || undefined}
        value={mobileDigits(value)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 15))}
      />
    );
  }

  const inputType = field.type === "email" || field.type === "number" ? field.type : "text";
  return (
    <input
      type={inputType}
      {...common}
      className={invalidClass(invalid)}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export { widthClass };
