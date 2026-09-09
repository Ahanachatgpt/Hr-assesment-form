import { FormField } from "./types";

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDay(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isDobField(field: Pick<FormField, "label" | "type">) {
  return /date of birth|\bdob\b/i.test(field.label);
}

export function ageFromDob(value: unknown, asOf = new Date()): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  let born: Date | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    born = new Date(`${raw}T00:00:00`);
  } else {
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) born = new Date(t);
  }
  if (!born || Number.isNaN(born.getTime())) return null;
  const end = Number.isNaN(asOf.getTime()) ? new Date() : asOf;
  let age = end.getFullYear() - born.getFullYear();
  const month = end.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && end.getDate() < born.getDate())) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

export function ageLabel(value: unknown, asOf?: Date | string): string {
  const at = typeof asOf === "string" ? new Date(asOf) : asOf;
  const age = ageFromDob(value, at);
  return age == null ? "" : `${age} year${age === 1 ? "" : "s"}`;
}

export function field(partial: Omit<FormField, "id" | "required"> & { required?: boolean }): FormField {
  return {
    id: uid("fld"),
    required: false,
    width: "full",
    ...partial,
  };
}

export function yesNoChoice(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value) && "answer" in (value as object)) {
    return String((value as { answer?: string }).answer ?? "");
  }
  return String(value ?? "");
}

export function formatYesNo(value: unknown): string {
  const answer = yesNoChoice(value);
  if (!answer) return "";
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const details = String((value as { details?: string }).details ?? "").trim();
    return details ? `${answer} — ${details}` : answer;
  }
  return answer;
}

export function answerPreview(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "object" && !Array.isArray(value) && "answer" in (value as object)) {
    return formatYesNo(value) || "—";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (typeof value[0] === "object") {
      return `${value.length} entr${value.length === 1 ? "y" : "ies"}`;
    }
    return value.join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export const FIELD_TYPE_LABELS: Record<string, string> = {
  section: "Section heading",
  text: "Short text",
  email: "Email",
  tel: "Phone",
  number: "Number",
  date: "Date",
  textarea: "Long text",
  select: "Dropdown",
  radio: "Single choice",
  checkbox: "Checkboxes",
  yesno: "Yes / No",
  file: "File upload",
  repeater: "Repeatable group",
};

export function isPhotoField(f: { label: string; accept?: string }) {
  return /image|photo/i.test(f.label) || (f.accept || "").includes("image");
}

export function isResumeField(f: { label: string }) {
  return /resume/i.test(f.label);
}

export function isCertificateField(f: { label: string }) {
  return /certificate|supporting document/i.test(f.label);
}

export function isMultiFileField(f: { label: string; multiple?: boolean }) {
  return Boolean(f.multiple) || isCertificateField(f);
}

export function isEmploymentField(field: Pick<FormField, "label" | "type">) {
  return field.type === "repeater" && /employment/i.test(field.label);
}

export function isRolesField(field: Pick<FormField, "label" | "type">) {
  return field.type === "textarea" && /roles?\s*&?\s*responsib/i.test(field.label);
}

export function hasEmploymentExperience(fields: FormField[], answers: Record<string, unknown>) {
  const emp = fields.find(isEmploymentField);
  if (!emp) return true;
  const rows = answers[emp.id];
  return Array.isArray(rows) && rows.length > 0;
}

export function minRepeaterRows(field: Pick<FormField, "label" | "defaultRows">): number {
  const n = field.defaultRows?.length || 0;
  const label = field.label.toLowerCase();
  if (/employment/.test(label)) return Math.max(n, 5);
  if (/training/.test(label)) return Math.max(n, 5);
  if (/reference/.test(label)) return Math.max(n, 2);
  if (/family/.test(label)) return Math.max(n, 5);
  if (/education/.test(label)) return Math.max(n, 4);
  return Math.max(n, 1);
}

export function padRepeaterRows(
  field: Pick<FormField, "label" | "defaultRows">,
  rows: unknown
): Record<string, unknown>[] {
  const submitted = Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
  const defaults = field.defaultRows || [];
  const count = Math.max(submitted.length, minRepeaterRows(field), defaults.length);
  const body: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    body.push({ ...(defaults[i] || {}), ...(submitted[i] || {}) });
  }
  return body;
}

export function followUpHeading(field: Pick<FormField, "followUpLabel" | "followUpPlaceholder">): string {
  return (field.followUpLabel || field.followUpPlaceholder || "Details").replace(/\s*\(optional\)\s*$/i, "").trim();
}

export function selectChoice(value: unknown): string {
  return yesNoChoice(value);
}

export function showSelectNotes(field: Pick<FormField, "followUpExcept" | "followUpLabel">, value: unknown): boolean {
  if (!field.followUpExcept && !field.followUpLabel) return false;
  const answer = selectChoice(value).trim();
  if (!answer) return false;
  const hide = (field.followUpExcept || []).map((x) => x.toLowerCase());
  return !hide.includes(answer.toLowerCase());
}

export function isMobileField(field: Pick<FormField, "type" | "label">) {
  return /mobile/i.test(field.label);
}

export function isEmergencyMobileField(field: Pick<FormField, "type" | "label">) {
  return isMobileField(field) && /emergency/i.test(field.label);
}

export function mobileDigits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

export const SAME_MOBILE_MSG = "Mobile number and emergency number cannot be the same.";

export function applySameMobileError(
  fields: FormField[],
  answers: Record<string, unknown>,
  errors: Record<string, string>
): Record<string, string> {
  const primary = fields.find((f) => isMobileField(f) && !isEmergencyMobileField(f));
  const emergency = fields.find(isEmergencyMobileField);
  if (!primary || !emergency) return errors;
  const a = mobileDigits(answers[primary.id]);
  const b = mobileDigits(answers[emergency.id]);
  if (a.length === 10 && b.length === 10 && a === b) {
    if (!errors[primary.id]) errors[primary.id] = SAME_MOBILE_MSG;
    if (!errors[emergency.id]) errors[emergency.id] = SAME_MOBILE_MSG;
  }
  return errors;
}

function isEmptyValue(value: unknown) {
  if (value == null || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && !Array.isArray(value) && "answer" in (value as object)) {
    return !String((value as { answer?: string }).answer ?? "").trim();
  }
  return false;
}

export function fieldError(field: FormField, value: unknown, file?: File | File[]): string {
  if (field.type === "section") return "";

  if (field.type === "file") {
    const list = Array.isArray(file) ? file : file ? [file] : [];
    if (field.required && list.length === 0) return `${field.label} is required.`;
    return "";
  }

  if (isMobileField(field)) {
    const digits = mobileDigits(value);
    if (field.required && digits.length === 0) return `${field.label} is required.`;
    if (digits.length > 0 && digits.length !== 10) return "Enter exactly 10 digits.";
    if (field.required && digits.length !== 10) return "Enter exactly 10 digits.";
    return "";
  }

  if (field.type === "repeater") {
    if (isEmploymentField(field) && !Array.isArray(value)) {
      return "Please select Yes or No.";
    }
    if (/family/i.test(field.label) && Array.isArray(value)) {
      const relField = (field.repeaterFields || []).find((rf) => /relation/i.test(rf.label));
      if (relField) {
        const counts: Record<string, number> = {};
        for (const row of value as Record<string, unknown>[]) {
          const rel = selectChoice(row[relField.id]).trim();
          if (["Father", "Mother", "Spouse"].some((r) => r.toLowerCase() === rel.toLowerCase())) {
            const key = rel.toLowerCase();
            counts[key] = (counts[key] || 0) + 1;
            if (counts[key] > 1) {
              const label = rel.charAt(0).toUpperCase() + rel.slice(1);
              return `${label} can only be added once in Family Details.`;
            }
          }
        }
      }
    }
    if (!field.required) return "";
    const rows = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    const filled = rows.some((row) =>
      Object.values(row || {}).some((v) => String(v ?? "").trim() !== "")
    );
    return filled ? "" : `${field.label} is required.`;
  }

  if (field.required && isEmptyValue(value)) return `${field.label} is required.`;

  if (field.type === "email" && String(value ?? "").trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) return "Enter a valid email address.";
  }

  return "";
}

export function validateAnswers(
  fields: FormField[],
  answers: Record<string, unknown>,
  files: Record<string, File | File[]> = {},
  contextFields: FormField[] = fields
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (isRolesField(field) && !hasEmploymentExperience(contextFields, answers)) continue;
    const err = fieldError(field, answers[field.id], files[field.id]);
    if (err) errors[field.id] = err;
  }
  return applySameMobileError(fields, answers, errors);
}
