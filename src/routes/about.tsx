import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the project — Bent Brim Co." },
      {
        name: "description",
        content:
          "Bent Brim Co. is a fictional Austin hat shop built to solve a very real problem: a one-person shop drowning in DMs, no-shows, and uncollected hats.",
      },
      { property: "og:title", content: "About the project — Bent Brim Co." },
      {
        property: "og:description",
        content:
          "A fictional hat shop, a very real scheduling problem. Here's what the booking flow and the Bench are actually doing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen">
      <div aria-hidden className="hatband h-2 w-full" />
      <main className="mx-auto max-w-5xl px-5 py-14">
        <Link
          to="/"
          className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-oxblood"
        >
          ← Back to the ticket
        </Link>
        <div className="mt-6 grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:gap-14">
          <div className="min-w-0">
            <h1 className="text-5xl leading-[0.95]">
              A fictional shop,
              <br />
              a very real problem.
            </h1>
            <div className="mt-8 space-y-5 text-lg leading-relaxed">
              <p>
                Bent Brim Co. doesn't exist. Sol Treviño doesn't either. The
                mess they're in does: one pair of hands, bookings arriving by
                DM, text, and voicemail, and a Saturday where nobody knows
                who's next.
              </p>
              <p>
                So the booking isn't a calendar. It's the paper claim ticket a
                hat shop tears in half at drop-off. You fill it in as you go,
                and the same ticket becomes your confirmation, your receipt,
                and your pickup pass.
              </p>
              <p>
                Availability is rule-driven, not a blank month. Felt needs a
                full day to set after steaming, so slots that can't make your
                date never show up — and the shop tells you why instead of
                going quiet.
              </p>
              <p>
                On the shop side, the Bench moves a hat forward with one tap,
                and the texts nobody has time to send — the 24-hour confirm,
                the ready-for-pickup, the seven-day nudge — send themselves.
                When somebody cancels, the waitlist gets the slot before Sol
                even knows it opened.
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                Demo only. No real payments, no real text messages, and the
                clock is one you can push forward yourself from the Bench.
              </p>
            </div>
          </div>
          <aside className="md:sticky md:top-8 md:self-start">
            <div className="overflow-hidden rounded-sm border border-border shadow-[var(--shadow-lift)]">
              <video
                src="https://cdn.shopify.com/videos/c/o/v/d1ce1e0d0d39446ebb3cd430022b299c.mp4"
                className="aspect-[9/16] w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                controls
              />
            </div>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-green-ink">
              Steam, shape, repeat
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
