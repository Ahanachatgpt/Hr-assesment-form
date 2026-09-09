"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AssessmentForm, FieldType, FormField } from "@/lib/types";
import { FIELD_TYPE_LABELS, uid } from "@/lib/utils";
import { FieldControl } from "./FieldControl";

const TYPES: FieldType[] = [
  "section",
  "text",
  "email",
  "tel",
  "number",
  "date",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "yesno",
  "file",
  "repeater",
];

export function FormBuilder({ formId }: { formId: string }) {
  const router = useRouter();
  const [form, setForm] = useState<AssessmentForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"build" | "preview">("build");
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetch(`/api/forms/${formId}`)
      .then((r) => r.json())
      .then((f) => {
        setForm(f);
        setSelected(f.fields[0]?.id || null);
      });
  }, [formId]);

  if (!form) return <p className="text-navy-600">Loading form…</p>;
  const current = form.fields.find((f) => f.id === selected);

  function patchField(id: string, patch: Partial<FormField>) {
    setForm((f) =>
      f ? { ...f, fields: f.fields.map((x) => (x.id === id ? { ...x, ...patch } : x)) } : f
    );
  }

  function move(id: string, dir: -1 | 1) {
    setForm((f) => {
      if (!f) return f;
      const i = f.fields.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= f.fields.length) return f;
      const fields = [...f.fields];
      [fields[i], fields[j]] = [fields[j], fields[i]];
      return { ...f, fields };
    });
  }

  function addField(type: FieldType) {
    const nf: FormField = {
      id: uid("fld"),
      type,
      label: type === "section" ? "New section" : "New question",
      required: type === "section" ? false : false,
      width: type === "section" || type === "textarea" || type === "repeater" || type === "file" ? "full" : "half",
      options: ["select", "radio", "checkbox"].includes(type) ? ["Option 1", "Option 2"] : undefined,
      repeaterFields:
        type === "repeater"
          ? [{ id: uid("fld"), type: "text", label: "Item", required: false, width: "half" }]
          : undefined,
      accept: type === "file" ? ".pdf,.doc,.docx,.html,.htm,.rtf,.txt,.odt" : undefined,
    };
    setForm((f) => (f ? { ...f, fields: [...f.fields, nf] } : f));
    setSelected(nf.id);
  }

  function removeField(id: string) {
    setForm((f) => {
      if (!f) return f;
      const fields = f.fields.filter((x) => x.id !== id);
      if (selected === id) setSelected(fields[0]?.id || null);
      return { ...f, fields };
    });
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(data);
      setMsg("Saved");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button className="text-sm text-navy-600 hover:underline" onClick={() => router.push("/admin/forms")}>
            ← All forms
          </button>
          <h1 className="font-display text-3xl">{form.title || "Untitled form"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn-secondary" href={`/apply/${form.slug}`} target="_blank">
            Preview live
          </a>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save form"}
          </button>
        </div>
      </div>
      {msg && <p className="mt-2 text-sm text-navy-600">{msg}</p>}

      <div className="card mt-5 grid gap-4 p-5 md:grid-cols-2">
        <div>
          <label className="field-label">Form title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Public URL slug</label>
          <div className="flex gap-2">
            <span className="self-center text-xs text-navy-500">/apply/</span>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Instructions shown to candidates</label>
          <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Department</label>
          <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as AssessmentForm["status"] })}
          >
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published (public link live)</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Notify email (optional override)</label>
          <input
            type="email"
            placeholder="Leave blank to use the global HR inbox in Settings"
            value={form.notifyEmail}
            onChange={(e) => setForm({ ...form, notifyEmail: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button className={tab === "build" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("build")}>
          Field customization
        </button>
        <button className={tab === "preview" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("preview")}>
          Layout preview
        </button>
      </div>

      {tab === "preview" ? (
        <div className="card mt-4 overflow-x-auto p-4 sm:p-6">
          <div className="grid grid-cols-12 gap-4">
            {form.fields.map((field) => (
              <FieldControl
                key={field.id}
                field={field}
                value={preview[field.id]}
                onChange={(v) => setPreview((p) => ({ ...p, [field.id]: v }))}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr_300px]">
          <div className="card p-3">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">Fields</p>
            <div className="max-h-[70vh] space-y-1 overflow-y-auto">
              {form.fields.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelected(f.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm ${
                    selected === f.id ? "bg-navy-800 text-white" : "hover:bg-navy-50"
                  }`}
                >
                  <span className="truncate">
                    {i + 1}. {f.label}
                  </span>
                  <span className={`ml-2 shrink-0 text-[10px] ${selected === f.id ? "text-navy-200" : "text-navy-400"}`}>
                    {FIELD_TYPE_LABELS[f.type]}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 border-t border-navy-100 pt-3">
              <p className="mb-2 px-1 text-xs font-semibold text-navy-500">Add field</p>
              <div className="flex flex-wrap gap-1">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addField(t)}
                    className="rounded-md bg-navy-50 px-2 py-1 text-[11px] font-medium text-navy-800 hover:bg-navy-100"
                  >
                    + {FIELD_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-5">
            {!current ? (
              <p className="text-navy-500">Select a field to edit.</p>
            ) : (
              <FieldEditor
                field={current}
                onChange={(p) => patchField(current.id, p)}
                onUp={() => move(current.id, -1)}
                onDown={() => move(current.id, 1)}
                onDelete={() => removeField(current.id)}
              />
            )}
          </div>

          <div className="card p-5 text-sm text-navy-700">
            <h3 className="font-semibold text-navy-900">How this works</h3>
            <ul className="mt-3 list-disc space-y-2 pl-4">
              <li>Publish the form so the public link works.</li>
              <li>Candidates attach PDF, Word, HTML or similar resumes.</li>
              <li>Submit converts answers to PDF and emails HR, with the resume as a second attachment.</li>
              <li>Use a repeater for education, experience or references.</li>
              <li>Only one file field is used as the resume attachment.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldEditor({
  field,
  onChange,
  onUp,
  onDown,
  onDelete,
}: {
  field: FormField;
  onChange: (p: Partial<FormField>) => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button className="btn-secondary" type="button" onClick={onUp}>
          Move up
        </button>
        <button className="btn-secondary" type="button" onClick={onDown}>
          Move down
        </button>
        <button className="btn-ghost text-red-700" type="button" onClick={onDelete}>
          Delete field
        </button>
      </div>
      <div>
        <label className="field-label">Field type</label>
        <select value={field.type} onChange={(e) => onChange({ type: e.target.value as FieldType })}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {FIELD_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Label</label>
        <input value={field.label} onChange={(e) => onChange({ label: e.target.value })} />
      </div>
      {field.type !== "section" && (
        <>
          <div>
            <label className="field-label">Placeholder</label>
            <input value={field.placeholder || ""} onChange={(e) => onChange({ placeholder: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Help text</label>
            <input value={field.helpText || ""} onChange={(e) => onChange({ helpText: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Width</label>
              <select
                value={field.width || "full"}
                onChange={(e) => onChange({ width: e.target.value as FormField["width"] })}
              >
                <option value="full">Full</option>
                <option value="half">Half</option>
                <option value="third">Third</option>
                <option value="quarter">Quarter</option>
              </select>
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onChange({ required: e.target.checked })}
              />
              Required
            </label>
          </div>
        </>
      )}
      {["select", "radio", "checkbox"].includes(field.type) && (
        <div>
          <label className="field-label">Options (one per line)</label>
          <textarea
            value={(field.options || []).join("\n")}
            onChange={(e) => onChange({ options: e.target.value.split("\n") })}
          />
        </div>
      )}
      {field.type === "file" && (
        <div>
          <label className="field-label">Accepted file types</label>
          <input value={field.accept || ""} onChange={(e) => onChange({ accept: e.target.value })} />
        </div>
      )}
      {field.type === "repeater" && (
        <div>
          <label className="field-label">Group fields</label>
          <div className="space-y-2">
            {(field.repeaterFields || []).map((rf, i) => (
              <div key={rf.id} className="grid grid-cols-2 gap-2 rounded-lg border border-navy-100 p-2">
                <input
                  value={rf.label}
                  onChange={(e) => {
                    const next = [...(field.repeaterFields || [])];
                    next[i] = { ...rf, label: e.target.value };
                    onChange({ repeaterFields: next });
                  }}
                />
                <select
                  value={rf.type}
                  onChange={(e) => {
                    const next = [...(field.repeaterFields || [])];
                    next[i] = { ...rf, type: e.target.value as FieldType };
                    onChange({ repeaterFields: next });
                  }}
                >
                  {TYPES.filter((t) => t !== "repeater" && t !== "section" && t !== "file").map((t) => (
                    <option key={t} value={t}>
                      {FIELD_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                onChange({
                  repeaterFields: [
                    ...(field.repeaterFields || []),
                    { id: uid("fld"), type: "text", label: "New item", required: false, width: "half" },
                  ],
                })
              }
            >
              + Sub-field
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
