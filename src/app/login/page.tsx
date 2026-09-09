"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AhanaLogo } from "@/components/AhanaLogo";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-navy-950">
      <div className="hidden flex-1 flex-col justify-between p-12 text-white lg:flex">
        <AhanaLogo size="sm" className="max-w-[220px]" />
        <div>
          <h1 className="font-display text-5xl leading-tight">
            Interview
            <br />
            assessment.
          </h1>
          <p className="mt-4 max-w-md text-navy-200">
            Candidate registration, resume collection, and HR scoring — delivered as PDF to the hiring inbox.
          </p>
        </div>
        <p className="text-xs text-navy-400">Confidential hiring records · PDF + resume delivery</p>
      </div>
      <div className="flex w-full items-center justify-center bg-[#f6f1e8] px-6 lg:w-[480px]">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <h2 className="font-display text-3xl text-navy-950">Sign in</h2>
          <p className="mt-1 text-sm text-navy-600">HR administrators only.</p>
          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-6 space-y-4">
            <div>
              <label className="field-label">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <button className="btn-primary mt-6 w-full" disabled={loading}>
            {loading ? "Signing in…" : "Enter dashboard"}
          </button>
          <p className="mt-4 text-center text-xs text-navy-500">Default login: admin / admin123</p>
        </form>
      </div>
    </div>
  );
}
