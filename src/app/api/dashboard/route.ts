import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [forms, submissions, settings] = await Promise.all([
    store.forms(),
    store.submissions(),
    store.settings(),
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const last7: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last7.push({
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      count: submissions.filter((s) => s.createdAt.slice(0, 10) === key).length,
    });
  }

  const byForm = forms.map((f) => ({
    id: f.id,
    title: f.title,
    count: submissions.filter((s) => s.formId === f.id).length,
  }));

  return NextResponse.json({
    companyName: settings.companyName,
    totals: {
      forms: forms.length,
      published: forms.filter((f) => f.status === "published").length,
      submissions: submissions.length,
      thisMonth: submissions.filter((s) => s.createdAt >= startOfMonth).length,
      emailed: submissions.filter((s) => s.emailStatus === "sent").length,
      pendingEmail: submissions.filter((s) => s.emailStatus === "not_configured" || s.emailStatus === "failed").length,
    },
    last7,
    byForm,
    recent: submissions.slice(0, 8),
  });
}
