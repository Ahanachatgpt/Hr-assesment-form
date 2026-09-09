import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const admin = await store.admin();
  if (username !== admin.username) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }
  const ok = await bcrypt.compare(password || "", admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }
  const session = await getSession();
  session.isLoggedIn = true;
  session.username = admin.username;
  await session.save();
  return NextResponse.json({ ok: true, username: admin.username });
}

export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 });
  }
  return NextResponse.json({ isLoggedIn: true, username: session.username });
}
