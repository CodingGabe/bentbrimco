import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClaimTicket } from "@/components/ClaimTicket";
import { SiteFooter } from "@/components/SiteFooter";
import { buildAvailability } from "@/lib/shop/rules";
import { useShop } from "@/lib/shop/store";
import { fmtLongDay, fmtTime } from "@/lib/shop/time";
import { serviceById } from "@/lib/shop/types";

export const Route = createFileRoute("/t/$code")({
  head: () => ({
    meta: [
      { title: "Your claim ticket — Bent Brim Co." },
      {
        name: "description",
        content:
          "Look up your Bent Brim Co. claim ticket, move your time, or cancel. No login needed.",
      },
      { property: "og:title", content: "Your claim ticket — Bent Brim Co." },
      {
        property: "og:description",
        content: "Reschedule or cancel your hat appointment. No login, no DM tag.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TicketPage,
});

function TicketPage() {
  const { code } = Route.useParams();
  const { state, actions } = useShop();
  const [moving, setMoving] = useState(false);
  const booking = state?.bookings.find((b) => b.code === code);

  const availability = useMemo(() => {
    if (!state || !booking) return [];
    return buildAvailability({
      now: state.now,
      serviceId: booking.serviceId,
      material: booking.material,
      deadline: booking.deadline,
      rules: state.rules,
      bookings: state.bookings.filter((b) => b.id !== booking.id),
    })
      .filter((d) => d.slots.length)
      .slice(0, 5);
  }, [state, booking]);

  if (!state) {
    return (
      <p className="p-10 font-mono text-sm text-muted-foreground">
        Checking the hook by the door…
      </p>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20">
        <h1 className="text-5xl leading-[0.95]">No ticket by that number.</h1>
        <p className="mt-4 text-muted-foreground">
          Check the text Sol sent you — it's four digits after BB. Or start a
          new one.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-12 items-center rounded-sm bg-oxblood px-5 font-mono text-sm uppercase tracking-widest text-primary-foreground"
        >
          Start a ticket
        </Link>
      </div>
    );
  }

  const svc = serviceById(booking.serviceId);
  const gone = ["cancelled", "picked", "noshow"].includes(booking.status);

  return (
    <div className="min-h-screen">
      <div aria-hidden className="hatband h-2 w-full" />
      <main className="mx-auto grid max-w-4xl gap-10 px-5 py-10 md:grid-cols-[1fr_320px]">
        <div>
          <Link
            to="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-oxblood"
          >
            ← Bent Brim Co.
          </Link>
          <h1 className="mt-4 text-5xl leading-[0.95]">
            {booking.name.split(" ")[0]}, here's your half.
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {svc.name} · {fmtLongDay(booking.start)} at {fmtTime(booking.start)}.
            Status:{" "}
            <span className="font-mono text-foreground">{booking.status}</span>.
          </p>

          {gone ? (
            <p className="mt-8 rounded-sm border border-border bg-secondary/60 p-4">
              This ticket's closed out. Start a fresh one whenever the hat needs
              it.
            </p>
          ) : (
            <>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setMoving((v) => !v)}
                  className="min-h-12 rounded-sm border border-foreground px-5 font-mono text-sm uppercase tracking-widest hover:bg-secondary"
                >
                  {moving ? "Keep my time" : "Move my time"}
                </button>
                <button
                  type="button"
                  onClick={() => actions.setStatus(booking.id, "cancelled")}
                  className="min-h-12 rounded-sm border border-oxblood px-5 font-mono text-sm uppercase tracking-widest text-oxblood hover:bg-oxblood hover:text-primary-foreground"
                >
                  Cancel
                </button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Free up to 24 hours before. Cancel and the slot goes straight to
                the waitlist.
              </p>

              {moving && (
                <div className="mt-8 space-y-5">
                  {availability.map((day) => (
                    <div key={day.date}>
                      <h2 className="font-display text-2xl">
                        {fmtLongDay(day.date)}
                      </h2>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {day.slots.map((s) => (
                          <button
                            key={s.start}
                            type="button"
                            onClick={() => {
                              actions.reschedule(booking.id, s.start);
                              setMoving(false);
                            }}
                            className="animate-tag min-h-11 rounded-sm border border-border bg-paper px-3 font-mono text-sm hover:border-oxblood"
                          >
                            {fmtTime(s.start)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <ClaimTicket
          draft={{
            service: svc,
            shape: booking.shape,
            branding: booking.branding,
            material: booking.material,
            size: booking.size,
            deadline: booking.deadline,
            start: booking.start,
            mode: booking.mode,
            rush: booking.rush,
            name: booking.name,
            phone: booking.phone,
            price: booking.price,
            deposit: booking.deposit,
            code: booking.code,
            pickupCode: booking.pickupCode,
          }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
