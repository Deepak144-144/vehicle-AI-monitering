import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight text-slate-100">
          Vehicle<span className="text-electric-400">Memory</span>
        </span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary">
            Get started
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <p className="mb-4 inline-flex rounded-full border border-electric-500/30 bg-electric-500/10 px-3 py-1 text-xs font-medium text-electric-400">
          Long-term memory layer, not a chatbot
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-5xl">
          A permanent memory for your vehicle.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
          Record every service, part, problem and diagnosis. Six months later,
          ask about a symptom and get an answer grounded in what your car
          actually went through &mdash; not a guess.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/register" className="btn-primary">
            Create your vehicle memory
          </Link>
          <Link href="/login" className="btn-ghost">
            I already have an account
          </Link>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-3">
          <article className="card card-hover">
            <div className="mb-3 text-2xl" aria-hidden>
              🧠
            </div>
            <h2 className="font-semibold text-slate-100">Structured memory</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Services, parts, problems, diagnostics, mileage and fuel economy
              are stored as real records you can edit, correct and verify.
            </p>
          </article>

          <article className="card card-hover">
            <div className="mb-3 text-2xl" aria-hidden>
              🔎
            </div>
            <h2 className="font-semibold text-slate-100">Semantic retrieval</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              &ldquo;Steering shakes at 100 km/h&rdquo; finds the record for
              &ldquo;car vibrates on highway&rdquo; through vector similarity,
              not keyword matching.
            </p>
          </article>

          <article className="card card-hover">
            <div className="mb-3 text-2xl" aria-hidden>
              🛡️
            </div>
            <h2 className="font-semibold text-slate-100">Honest answers</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              History is never invented, and a past diagnosis is never treated
              as the current cause. Facts and suggestions stay clearly separated.
            </p>
          </article>
        </div>

        <div className="card mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            The difference it makes
          </h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                You
              </p>
              <p className="mt-2 text-slate-200">
                &ldquo;My car is vibrating at high speed.&rdquo;
              </p>
            </div>
            <div className="rounded-xl border border-graphite-700 bg-graphite-900 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                With vehicle memory
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                I found a similar issue in your vehicle history. At around
                62,000 km the vehicle experienced high-speed vibration. Wheel
                imbalance was diagnosed and wheel balancing resolved it.
                <span className="mt-2 block text-slate-400">
                  That does not confirm the current cause, but wheel balance and
                  tire condition are worth checking first.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
