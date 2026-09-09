import Link from "next/link";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const settings = await store.settings();
  return (
    <div className="paper-bg flex min-h-screen items-center justify-center px-5">
      <div className="card max-w-lg p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>
        <h1 className="mt-5 font-display text-3xl text-navy-950">Application received</h1>
        <p className="mt-3 text-navy-700">
          Thank you. {settings.companyName} HR has been notified. A PDF of your answers and your attached resume are on
          the way to our hiring mailbox.
        </p>
        <Link href={`/apply/${slug}`} className="btn-secondary mt-8 inline-flex">
          Submit another response
        </Link>
        <div className="mt-3">
          <Link href="/" className="text-sm font-medium text-navy-700 hover:underline">
            Back to openings
          </Link>
        </div>
      </div>
    </div>
  );
}
