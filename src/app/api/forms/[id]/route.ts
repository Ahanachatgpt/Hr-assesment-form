import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { slugify, uid } from "@/lib/utils";

async function guard() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const form = await store.formById(id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(form);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const existing = await store.formById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const forms = await store.forms();
  let slug = slugify(body.slug || existing.slug);
  if (forms.some((f) => f.slug === slug && f.id !== id)) {
    slug = `${slug}-${uid("x").slice(-4)}`;
  }
  const updated = {
    ...existing,
    ...body,
    id,
    slug,
    updatedAt: new Date().toISOString(),
  };
  await store.saveForm(updated);
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  await store.deleteForm(id);
  return NextResponse.json({ ok: true });
}
