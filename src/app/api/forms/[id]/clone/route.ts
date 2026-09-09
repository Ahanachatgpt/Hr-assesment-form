import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { uid, slugify } from "@/lib/utils";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const form = await store.formById(id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const now = new Date().toISOString();
  const clone = {
    ...form,
    id: uid("form"),
    title: `${form.title} (copy)`,
    slug: `${slugify(form.slug)}-copy-${uid("x").slice(-4)}`,
    status: "draft" as const,
    createdAt: now,
    updatedAt: now,
  };
  await store.saveForm(clone);
  return NextResponse.json(clone);
}
