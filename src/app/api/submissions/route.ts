import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const formId = searchParams.get("formId");
  let list = await store.submissions();
  if (formId) list = list.filter((s) => s.formId === formId);
  return NextResponse.json(list);
}
