"use client";

import { useState } from "react";
import { HrReview, RatingLevel, RatingRow, Submission } from "@/lib/types";
import { emptyHrReview } from "@/lib/hrReview";
import { DateDropdowns } from "./DateDropdowns";

const LEVELS: RatingLevel[] = ["Excellent", "Very good", "Good", "Fair", "Poor"];

export function HrReviewForm({
  submission,
  onSaved,
}: {
  submission: Submission;
  onSaved: (s: Submission) => void;
}) {
  const [review, setReview] = useState<HrReview>(submission.hrReview || emptyHrReview());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function setRating(group: "hrRatings" | "hodRatings", i: number, patch: Partial<RatingRow>) {
    setReview((r) => ({
      ...r,
      [group]: r[group].map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
    }));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/submissions/${submission.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hr-review", hrReview: review }),
    });
    const data = await res.json();
    if (data?.id) {
      onSaved(data);
      setMsg("HR assessment saved. Download PDF to include these scores.");
    }
    setSaving(false);
  }

  return (
    <div className="card mt-5 p-5">
      <h2 className="font-display text-2xl">HR department</h2>
      <p className="mt-1 text-sm text-navy-600">
        Complete after the interview. Scores are stored with the candidate and printed on the PDF.
      </p>

      <RatingTable
        title="HR assessment"
        rows={review.hrRatings}
        onChange={(i, p) => setRating("hrRatings", i, p)}
      />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="field-label">Functional Head</label>
          <input value={review.functionalHead} onChange={(e) => setReview({ ...review, functionalHead: e.target.value })} />
        </div>
        <div>
          <label className="field-label">HR's Signature</label>
          <input value={review.hrSignature} onChange={(e) => setReview({ ...review, hrSignature: e.target.value })} />
        </div>
      </div>

      <RatingTable
        title="Functional Head / HOD"
        rows={review.hodRatings}
        onChange={(i, p) => setRating("hodRatings", i, p)}
      />
      <div className="mt-4">
        <label className="field-label">HOD's Signature</label>
        <input value={review.hodSignature} onChange={(e) => setReview({ ...review, hodSignature: e.target.value })} />
      </div>

      <h3 className="mt-8 font-semibold text-navy-900">Management remarks</h3>
      <div className="mt-3">
        <label className="field-label">Remarks</label>
        <textarea
          rows={4}
          value={review.managementRemarks}
          onChange={(e) => setReview({ ...review, managementRemarks: e.target.value })}
        />
      </div>

      <h3 className="mt-8 font-semibold text-navy-900">To be completed by HR following candidate selection</h3>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {(
          [
            ["designation", "Designation"],
            ["location", "Location"],
            ["salary", "Salary"],
            ["probationPeriod", "Probation Period"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="field-label">{label}</label>
            <input value={review[key]} onChange={(e) => setReview({ ...review, [key]: e.target.value })} />
          </div>
        ))}
        <div>
          <label className="field-label">Date Of Joining</label>
          <DateDropdowns
            value={review.dateOfJoining}
            onChange={(v) => setReview({ ...review, dateOfJoining: v })}
            label="Date Of Joining"
          />
        </div>
        <div>
          <label className="field-label">Review Date</label>
          <DateDropdowns
            value={review.reviewDate}
            onChange={(v) => setReview({ ...review, reviewDate: v })}
            label="Review Date"
          />
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Management Approval</label>
          <input value={review.managementApproval} onChange={(e) => setReview({ ...review, managementApproval: e.target.value })} />
        </div>
      </div>

      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      <button className="btn-primary mt-4 w-full sm:w-auto" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save HR assessment"}
      </button>
    </div>
  );
}

function RatingTable({
  title,
  rows,
  onChange,
}: {
  title: string;
  rows: RatingRow[];
  onChange: (i: number, p: Partial<RatingRow>) => void;
}) {
  return (
    <div className="mt-5 overflow-x-auto">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <table className="w-full text-left text-sm">
        <thead className="bg-navy-50 text-xs uppercase text-navy-500">
          <tr>
            <th className="px-3 py-2">Criterion</th>
            {LEVELS.map((l) => (
              <th key={l} className="px-2 py-2 text-center">
                {l}
              </th>
            ))}
            <th className="px-3 py-2">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.criterion} className="border-t border-navy-50">
              <td className="px-3 py-2 font-medium">{row.criterion}</td>
              {LEVELS.map((l) => (
                <td key={l} className="px-2 py-2 text-center">
                  <input type="radio" name={`${title}-${row.criterion}`} checked={row.rating === l} onChange={() => onChange(i, { rating: l })} />
                </td>
              ))}
              <td className="px-3 py-2">
                <input value={row.remarks} onChange={(e) => onChange(i, { remarks: e.target.value })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
