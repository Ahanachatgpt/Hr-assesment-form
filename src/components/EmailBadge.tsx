export function EmailBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent: "bg-emerald-100 text-emerald-800",
    failed: "bg-red-100 text-red-800",
    pending: "bg-amber-100 text-amber-800",
    not_configured: "bg-slate-100 text-slate-700",
    skipped: "bg-slate-100 text-slate-700",
  };
  const labels: Record<string, string> = {
    sent: "Emailed",
    failed: "Email failed",
    pending: "Pending",
    not_configured: "SMTP not set",
    skipped: "Skipped",
  };
  return <span className={`badge ${map[status] || "bg-slate-100"}`}>{labels[status] || status}</span>;
}
