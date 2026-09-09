import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { AssessmentForm } from "@/lib/types";
import { slugify, uid } from "@/lib/utils";

async function guard() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const [forms, submissions] = await Promise.all([store.forms(), store.submissions()]);
  const withCounts = forms.map((f) => ({
    ...f,
    submissions: submissions.filter((s) => s.formId === f.id).length,
  }));
  return NextResponse.json(withCounts);
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json();
  const forms = await store.forms();
  let slug = slugify(body.slug || body.title || "form");
  if (forms.some((f) => f.slug === slug)) slug = `${slug}-${uid("x").slice(-4)}`;
  const now = new Date().toISOString();
  const form: AssessmentForm = {
    id: uid("form"),
    title: body.title || "Untitled form",
    slug,
    description: body.description || "",
    instructions: body.instructions || "",
    department: body.department || "Human Resources",
    status: body.status || "draft",
    fields: body.fields || [],
    notifyEmail: body.notifyEmail || "",
    createdAt: now,
    updatedAt: now,
  };
  await store.saveForm(form);
  return NextResponse.json(form);
}
