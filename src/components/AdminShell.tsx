"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AhanaLogo } from "./AhanaLogo";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/forms", label: "Forms" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-navy-50">
      <aside className="hidden w-60 shrink-0 flex-col bg-navy-950 text-white md:flex">
        <div className="px-5 py-6">
          <AhanaLogo size="sm" className="max-w-full" />
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-navy-300">HR Admin</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-white/10 font-semibold text-white" : "text-navy-200 hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4">
          <Link href="/" className="block px-3 py-2 text-xs text-navy-300 hover:text-white">
            View public site
          </Link>
          <button onClick={logout} className="w-full rounded-lg px-3 py-2 text-left text-sm text-navy-200 hover:bg-white/5">
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 bg-white px-4 py-3 md:hidden">
          <span className="font-display text-lg">HR Admin</span>
          <nav className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-navy-700">
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 p-4 sm:p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
