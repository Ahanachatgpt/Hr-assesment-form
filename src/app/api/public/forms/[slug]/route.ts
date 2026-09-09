import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(_: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const form = await store.formBySlug(slug);
  if (!form || form.status !== "published") {
    return NextResponse.json({ error: "This form is not available." }, { status: 404 });
  }
  const settings = await store.settings();
  return NextResponse.json({
    form,
    companyName: settings.companyName,
    companyTagline: settings.companyTagline,
    supportEmail: settings.supportEmail,
  });
}
