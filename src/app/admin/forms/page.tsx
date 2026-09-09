"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface FormRow {
  id: string;
  title: string;
  slug: string;
  department: string;
  status: string;
  updatedAt: string;
  submissions: number;
}

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormRow[]>([]);
  const [creating, setCreating] = useState(false);

  function load() {
    fetch("/api/forms")
      .then((r) => r.json())
      .then(setForms);
  }

  useEffect(load, []);

  async function createForm() {
    setCreating(true);
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New assessment form",
        description: "Customize fields, then publish a shareable link.",
        status: "draft",
        fields: [
          { id: "fld_name", type: "text", label: "Full name", required: true, width: "half" },
          { id: "fld_email", type: "email", label: "Email address", required: true, width: "half" },
          {
            id: "fld_resume",
            type: "file",
            label: "Attach resume",
            required: true,
            accept: ".pdf,.doc,.docx,.html,.htm,.rtf,.txt,.odt",
          },
        ],
      }),
    });
    const form = await res.json();
    router.push(`/admin/forms/${form.id}`);
  }

  async function cloneForm(id: string) {
    const res = await fetch(`/api/forms/${id}/clone`, { method: "POST" });
    const form = await res.json();
    router.push(`/admin/forms/${form.id}`);
  }

  async function remove(id: string) {
    if (!confirm("Delete this form? Existing submissions are kept.")) return;
    await fetch(`/api/forms/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">Library</p>
          <h1 className="font-display text-3xl">Assessment forms</h1>
          <p className="mt-1 text-sm text-navy-600">Create multiple forms, customize fields, and share unique links.</p>
        </div>
        <button className="btn-primary" onClick={createForm} disabled={creating}>
          {creating ? "Creating…" : "+ New form"}
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        {forms.map((f) => (
          <div key={f.id} className="card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl">{f.title}</h2>
                <StatusBadge status={f.status} />
              </div>
              <p className="mt-1 text-sm text-navy-600">
                {f.department} · {f.submissions} submission{f.submissions === 1 ? "" : "s"} · Updated {formatDate(f.updatedAt)}
              </p>
              <p className="mt-1 font-mono text-xs text-navy-500">/apply/{f.slug}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/apply/${f.slug}`} target="_blank" className="btn-secondary">
                Open link
              </Link>
              <button
                className="btn-secondary"
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/apply/${f.slug}`)}
              >
                Copy link
              </button>
              <Link href={`/admin/forms/${f.id}`} className="btn-primary">
                Customize fields
              </Link>
              <button className="btn-ghost" onClick={() => cloneForm(f.id)}>
                Duplicate
              </button>
              <button className="btn-ghost text-red-700" onClick={() => remove(f.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "published"
      ? "bg-emerald-100 text-emerald-800"
      : status === "archived"
        ? "bg-slate-200 text-slate-700"
        : "bg-amber-100 text-amber-800";
  return <span className={`badge ${cls}`}>{status}</span>;
}
