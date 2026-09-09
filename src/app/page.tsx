import Link from "next/link";
import { store } from "@/lib/store";
import { AhanaLogo } from "@/components/AhanaLogo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, forms] = await Promise.all([store.settings(), store.forms()]);
  const open = forms.filter((f) => f.status === "published");

  return (
    <div className="paper-bg min-h-screen">
      <header className="border-b border-navy-900/10 bg-navy-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-display text-lg tracking-tight sm:text-xl">{settings.companyName}</p>
            <p className="text-xs text-navy-200">{settings.companyTagline}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <AhanaLogo size="sm" className="hidden sm:block" />
            <Link href="/login" className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10">
              HR login
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Careers</p>
        <h1 className="mt-3 font-display text-4xl text-navy-950 md:text-5xl">Interview assessment</h1>
        <p className="mt-4 max-w-2xl text-navy-700">
          Complete the candidate registration form, upload your photograph and resume. HR receives a PDF of this
          assessment with your resume attached.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {open.map((form) => (
            <Link
              key={form.id}
              href={`/apply/${form.slug}`}
              className="card group p-6 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">{form.department}</p>
              <h2 className="mt-2 font-display text-2xl text-navy-900 group-hover:text-navy-700">{form.title}</h2>
              <p className="mt-2 text-sm text-navy-600">{form.description}</p>
              <span className="mt-5 inline-flex text-sm font-semibold text-navy-800">Open form →</span>
            </Link>
          ))}
          {open.length === 0 && (
            <div className="card p-8 text-navy-600">No published forms yet. HR can publish one from the admin workspace.</div>
          )}
        </div>
      </main>
    </div>
  );
}
