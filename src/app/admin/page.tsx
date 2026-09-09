"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { Submission } from "@/lib/types";
import { EmailBadge } from "@/components/EmailBadge";

interface Dash {
  companyName: string;
  totals: {
    forms: number;
    published: number;
    submissions: number;
    thisMonth: number;
    emailed: number;
    pendingEmail: number;
  };
  last7: { day: string; count: number }[];
  byForm: { id: string; title: string; count: number }[];
  recent: Submission[];
}

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-navy-600">Loading dashboard…</p>;
  const max = Math.max(1, ...data.last7.map((d) => d.count));
  const maxForm = Math.max(1, ...data.byForm.map((d) => d.count));

  const cards = [
    { label: "Total submissions", value: data.totals.submissions },
    { label: "This month", value: data.totals.thisMonth },
    { label: "Published forms", value: data.totals.published },
    { label: "Email pending / failed", value: data.totals.pendingEmail },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">Overview</p>
          <h1 className="font-display text-3xl text-navy-950">Hiring dashboard</h1>
        </div>
        <Link href="/admin/forms" className="btn-primary">
          Create form
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-500">{c.label}</p>
            <p className="mt-2 font-display text-3xl">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold text-navy-900">Submissions — last 7 days</h2>
          <div className="mt-4 flex h-40 items-end gap-3">
            {data.last7.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-navy-800"
                  style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 8 : 2 }}
                />
                <span className="text-[11px] text-navy-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-navy-900">By form</h2>
          <div className="mt-4 space-y-3">
            {data.byForm.map((f) => (
              <div key={f.id}>
                <div className="flex justify-between text-sm">
                  <span className="truncate pr-3">{f.title}</span>
                  <span className="font-semibold">{f.count}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-navy-100">
                  <div
                    className="h-2 rounded-full bg-gold-500"
                    style={{ width: `${(f.count / maxForm) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-3">
          <h2 className="font-semibold">Recent submissions</h2>
          <Link href="/admin/submissions" className="text-sm font-medium text-navy-700 hover:underline">
            View all
          </Link>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-navy-50 text-xs uppercase text-navy-500">
            <tr>
              <th className="px-5 py-2">Candidate</th>
              <th className="px-5 py-2">Form</th>
              <th className="px-5 py-2">Email status</th>
              <th className="px-5 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((s) => (
              <tr key={s.id} className="border-t border-navy-50 hover:bg-navy-50/60">
                <td className="px-5 py-3">
                  <Link href={`/admin/submissions/${s.id}`} className="font-medium text-navy-900 hover:underline">
                    {s.candidateName}
                  </Link>
                  <div className="text-xs text-navy-500">{s.candidateEmail}</div>
                </td>
                <td className="px-5 py-3">{s.formTitle}</td>
                <td className="px-5 py-3">
                  <EmailBadge status={s.emailStatus} />
                </td>
                <td className="px-5 py-3 text-navy-600">{formatDate(s.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
