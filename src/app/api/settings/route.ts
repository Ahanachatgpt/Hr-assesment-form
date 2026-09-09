import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { sendTestEmail } from "@/lib/mail";

async function guard() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const settings = await store.settings();
  return NextResponse.json({ ...settings, smtpPass: settings.smtpPass ? "********" : "" });
}

export async function PUT(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json();
  const current = await store.settings();
  if (body.smtpPass === "********") delete body.smtpPass;
  const { currentPassword, newPassword, newUsername, ...rest } = body;
  const settings = await store.updateSettings({ ...current, ...rest });

  if (newPassword || newUsername) {
    const admin = await store.admin();
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required to change login details" }, { status: 400 });
    }
    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    await store.updateAdmin({
      username: newUsername || admin.username,
      passwordHash: newPassword ? await bcrypt.hash(newPassword, 10) : admin.passwordHash,
    });
  }

  return NextResponse.json({ ...settings, smtpPass: settings.smtpPass ? "********" : "" });
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const { to } = await req.json();
  const settings = await store.settings();
  try {
    await sendTestEmail(settings, to || settings.notifyEmail);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send test email" },
      { status: 500 }
    );
  }
}
