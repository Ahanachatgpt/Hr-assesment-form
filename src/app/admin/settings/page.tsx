"use client";

import { useEffect, useState } from "react";
import { AppSettings } from "@/lib/types";

export default function SettingsPage() {
  const [form, setForm] = useState<AppSettings | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("admin");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setForm);
  }, []);

  if (!form) return <p>Loading settings…</p>;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setError("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
        newUsername: newUsername || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else {
      setForm(data);
      setMsg("Settings saved.");
      setCurrentPassword("");
      setNewPassword("");
    }
    setSaving(false);
  }

  async function testEmail() {
    if (!form) return;
    setMsg("");
    setError("");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: form.notifyEmail }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else setMsg("Test email sent.");
  }

  return (
    <form onSubmit={save} className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">Configuration</p>
      <h1 className="font-display text-3xl">Settings</h1>
      <p className="mt-1 text-sm text-navy-600">
        Branding, HR inbox, and SMTP. Filled forms are emailed as PDF with the resume as a second attachment.
      </p>
      {msg && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}
      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      <section className="card mt-6 space-y-4 p-5">
        <h2 className="font-semibold">Company</h2>
        <div>
          <label className="field-label">Company name</label>
          <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Tagline</label>
          <input value={form.companyTagline} onChange={(e) => setForm({ ...form, companyTagline: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Support email (shown on public forms)</label>
          <input
            type="email"
            value={form.supportEmail}
            onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
          />
        </div>
      </section>

      <section className="card mt-5 space-y-4 p-5">
        <h2 className="font-semibold">HR inbox</h2>
        <div>
          <label className="field-label">Send submissions to</label>
          <input
            type="email"
            value={form.notifyEmail}
            onChange={(e) => setForm({ ...form, notifyEmail: e.target.value })}
          />
          <p className="mt-1 text-xs text-navy-500">
            Each submit emails this address: (1) PDF of filled answers (2) original resume file.
          </p>
        </div>
      </section>

      <section className="card mt-5 space-y-4 p-5">
        <h2 className="font-semibold">SMTP</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="field-label">Host</label>
            <input
              placeholder="smtp.gmail.com"
              value={form.smtpHost}
              onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Port</label>
            <input
              type="number"
              value={form.smtpPort}
              onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="field-label">Username</label>
            <input value={form.smtpUser} onChange={(e) => setForm({ ...form, smtpUser: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Password / app password</label>
            <input
              type="password"
              value={form.smtpPass}
              onChange={(e) => setForm({ ...form, smtpPass: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">From name</label>
            <input value={form.smtpFromName} onChange={(e) => setForm({ ...form, smtpFromName: e.target.value })} />
          </div>
          <div>
            <label className="field-label">From email</label>
            <input
              type="email"
              value={form.smtpFromEmail}
              onChange={(e) => setForm({ ...form, smtpFromEmail: e.target.value })}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.smtpSecure}
            onChange={(e) => setForm({ ...form, smtpSecure: e.target.checked })}
          />
          Use TLS/SSL (port 465)
        </label>
        <button type="button" className="btn-secondary" onClick={testEmail}>
          Send test email
        </button>
      </section>

      <section className="card mt-5 space-y-4 p-5">
        <h2 className="font-semibold">Admin login</h2>
        <div>
          <label className="field-label">Username</label>
          <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Current password (required to change login)</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className="field-label">New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
      </section>

      <button className="btn-primary mt-6" disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
