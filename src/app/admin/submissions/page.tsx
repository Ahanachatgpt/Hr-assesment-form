"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Submission } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { EmailBadge } from "@/components/EmailBadge";

export default function SubmissionsPage() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then(setRows);
  }, []);

  const filtered = rows.filter((s) => {
    const hay = `${s.candidateName} ${s.candidateEmail} ${s.formTitle}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">Inbox</p>
          <h1 className="font-display text-3xl">Submissions</h1>
        </div>
        <input
          className="max-w-xs"
          placeholder="Search candidate or form…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy-50 text-xs uppercase text-navy-500">
            <tr>
              <th className="px-5 py-3">Candidate</th>
              <th className="px-5 py-3">Form</th>
              <th className="px-5 py-3">Resume</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-navy-50 hover:bg-navy-50/50">
                <td className="px-5 py-3">
                  <Link href={`/admin/submissions/${s.id}`} className="font-semibold text-navy-900 hover:underline">
                    {s.candidateName}
                  </Link>
                  <div className="text-xs text-navy-500">{s.candidateEmail}</div>
                </td>
                <td className="px-5 py-3">{s.formTitle}</td>
                <td className="px-5 py-3 text-navy-600">{s.resumeName || "—"}</td>
                <td className="px-5 py-3">
                  <EmailBadge status={s.emailStatus} />
                </td>
                <td className="px-5 py-3 text-navy-600">{formatDate(s.createdAt)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-navy-500">
                  No submissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
