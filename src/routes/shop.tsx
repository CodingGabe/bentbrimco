import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/SiteFooter";
import { MESSAGE_LABEL } from "@/lib/shop/messages";
import { useShop } from "@/lib/shop/store";
import {
  DAY,
  HOUR,
  fmtDay,
  fmtLongDay,
  fmtStamp,
  fmtTime,
  relative,
  sameDay,
  startOfDay,
} from "@/lib/shop/time";
import {
  type Booking,
  type BookingStatus,
  serviceById,
} from "@/lib/shop/types";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "The Bench — Bent Brim Co. shop side" },
      {
        name: "description",
        content:
          "Sol's workbench: today's hats, rush requests, no-show radar, the waitlist, and every text the shop sent without lifting a finger.",
      },
      { property: "og:title", content: "The Bench — Bent Brim Co." },
      {
        property: "og:description",
        content:
          "One board, one tap per hat. Reminders, waitlist refills, and pickup chasing run themselves.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Bench,
});

const COLUMNS: { key: BookingStatus; label: string; next?: BookingStatus }[] = [
  { key: "booked", label: "Booked", next: "block" },
  { key: "block", label: "On the block", next: "drying" },
  { key: "drying", label: "Steaming / drying", next: "ready" },
  { key: "ready", label: "Ready", next: "picked" },
  { key: "picked", label: "Picked up" },
];

type Tab = "bench" | "log" | "rules";

function Bench() {
  const { state, actions } = useShop();
  const [tab, setTab] = useState<Tab>("bench");

  const today = useMemo(() => {
    if (!state) return [];
    return state.bookings.filter(
      (b) =>
        sameDay(b.start, state.now) ||
        ["ready", "drying", "block"].includes(b.status) ||
        (b.status === "picked" && !!b.pickedAt && sameDay(b.pickedAt, state.now)),
    );
  }, [state]);

  if (!state) {
    return (
      <p className="p-10 font-mono text-sm text-muted-foreground">
        Wiping down the bench…
      </p>
    );
  }

  const requests = state.bookings.filter((b) => b.status === "requested");
  const risky = state.bookings.filter(
    (b) =>
      b.status === "booked" &&
      new Date(b.start).getTime() > new Date(state.now).getTime() &&
      (b.deposit === 0 || (b.firstTime && !b.repliedToReminder)),
  );
  const hoursSaved = ((state.automatedActions * 3.5 + state.bookings.length * 4) / 60).toFixed(1);

  return (
    <div className="min-h-screen">
      <div aria-hidden className="hatband h-2 w-full" />
      <header className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-5">
        <div>
          <Link
            to="/"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-oxblood"
          >
            ← Customer side
          </Link>
          <h1 className="text-4xl leading-none">The Bench</h1>
          <p className="font-mono text-xs text-muted-foreground">
            {fmtLongDay(state.now)} · {fmtTime(state.now)} · shop clock
          </p>
        </div>
        <TimeMachine
          onAdvance={(ms) => actions.advance(ms)}
          onSaturday={() => {
            const d = startOfDay(new Date(state.now));
            const delta = (6 - d.getDay() + 7) % 7 || 7;
            const target = new Date(d.getTime() + delta * DAY);
            target.setHours(10, 0, 0, 0);
            actions.advanceTo(target.toISOString());
          }}
          onReset={() => actions.reset()}
        />
      </header>

      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          {(
            [
              ["bench", "Today's bench"],
              ["log", "Automatic messages"],
              ["rules", "Shop rules"],
            ] as const
          ).map(([k, label]) => (
            <Button variant="ghost"
              key={k}
              type="button"
              onClick={() => setTab(k)}
              aria-pressed={tab === k}
              className={`min-h-11 rounded-sm px-3 font-mono text-xs uppercase tracking-[0.18em] ${
                tab === k
                  ? "bg-oxblood text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Button>
          ))}
          <p className="ml-auto font-mono text-xs text-sage">
            {hoursSaved} hrs saved this week · {state.automatedActions} automated
            actions
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {tab === "bench" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {COLUMNS.map((col) => {
                const items = today.filter((b) => b.status === col.key);
                return (
                  <section
                    key={col.key}
                     className="rounded-sm border border-border bg-secondary/40 p-4"
                  >
                     <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-green-ink">
                      {col.label} ({items.length})
                    </h2>
                     <div className="mt-4 space-y-3">
                      {items.length === 0 && (
                        <p className="font-mono text-xs text-muted-foreground">
                          Empty hook.
                        </p>
                      )}
                      {items.map((b) => (
                        <HatCard
                          key={b.id}
                          b={b}
                          nextLabel={
                            col.next
                              ? col.next === "picked"
                                ? "Picked up"
                                : `→ ${COLUMNS.find((c) => c.key === col.next)?.label}`
                              : undefined
                          }
                          onAdvance={
                            col.next
                              ? () => actions.setStatus(b.id, col.next!)
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <Panel title="New requests" hint="Everything else auto-confirms.">
                {requests.length === 0 && <Empty>Nothing waiting on you.</Empty>}
                {requests.map((b) => (
                    <div key={b.id} className="rounded-sm border border-brass/60 bg-paper p-4">
                    <p className="font-display text-lg leading-tight">{b.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {serviceById(b.serviceId).name} · {fmtStamp(b.start)}
                      {b.rush ? " · RUSH" : ""}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button variant="ghost"
                        type="button"
                        onClick={() => actions.approveRequest(b.id)}
                        className="min-h-11 flex-1 rounded-sm bg-oxblood px-3 font-mono text-xs uppercase tracking-widest text-primary-foreground"
                      >
                        Take it
                      </Button>
                      <Button variant="ghost"
                        type="button"
                        onClick={() => actions.setStatus(b.id, "cancelled")}
                        className="min-h-11 rounded-sm border border-border px-3 font-mono text-xs uppercase tracking-widest"
                      >
                        Pass
                      </Button>
                    </div>
                  </div>
                ))}
              </Panel>

              <Panel title="No-show radar" hint="First-timer, no deposit, no reply.">
                {risky.length === 0 && <Empty>Week looks honest.</Empty>}
                {risky.map((b) => (
                   <div key={b.id} className="rounded-sm border border-border bg-paper p-4">
                    <p className="font-display text-lg leading-tight">{b.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {fmtStamp(b.start)} · {relative(state.now, b.start)}
                    </p>
                    <ul className="mt-1 font-mono text-[11px] text-oxblood">
                      {b.deposit === 0 && <li>no deposit</li>}
                      {b.firstTime && <li>first time in</li>}
                      {!b.repliedToReminder && <li>no reply to the 24h text</li>}
                    </ul>
                    <div className="mt-2 flex gap-2">
                       <Button variant="ghost"
                        type="button"
                        onClick={() => actions.markReplied(b.id)}
                        className="min-h-11 flex-1 rounded-sm border border-sage px-3 font-mono text-xs uppercase tracking-widest text-sage"
                      >
                        They replied
                       </Button>
                       <Button variant="ghost"
                        type="button"
                        onClick={() => actions.setStatus(b.id, "cancelled")}
                        className="min-h-11 rounded-sm border border-border px-3 font-mono text-xs uppercase tracking-widest"
                      >
                        Release
                       </Button>
                    </div>
                  </div>
                ))}
              </Panel>

              <Panel title="The waitlist" hint="Cancel a slot and it texts itself out.">
                {state.waitlist.map((w) => (
                   <div key={w.id} className="rounded-sm border border-border bg-paper p-4">
                    <p className="font-display text-lg leading-tight">{w.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {w.wants}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-sage">
                      {w.claimed
                        ? "Claimed the open slot"
                        : w.notifiedFor
                          ? `Texted about ${fmtDay(w.notifiedFor)} — waiting on a reply`
                          : "Standing by"}
                    </p>
                  </div>
                ))}
              </Panel>
            </div>
          </>
        )}

        {tab === "log" && (
          <section className="max-w-2xl">
            <h2 className="text-3xl">Sent without Sol lifting a finger</h2>
            <ol className="mt-6 space-y-3">
              {state.messages.slice(0, 40).map((m) => (
                <li
                  key={m.id}
                  className="rounded-sm border border-border bg-paper p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                     <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-green-ink">
                      {MESSAGE_LABEL[m.kind] ?? m.kind}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {m.to} · {fmtStamp(m.sentAt)}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-sm">{m.body}</p>
                </li>
              ))}
              {state.messages.length === 0 && <Empty>Quiet line.</Empty>}
            </ol>
          </section>
        )}

        {tab === "rules" && (
          <section className="max-w-lg space-y-5">
            <h2 className="text-3xl">Shop rules</h2>
            <p className="text-muted-foreground">
              Set these once. The booking page enforces them so you don't have
              to.
            </p>
            <RuleRow
              label="Buffer between sessions"
              value={state.rules.bufferMin}
              suffix="min"
              onChange={(v) => actions.updateRules({ bufferMin: v })}
              min={0}
              max={60}
              step={5}
            />
            <RuleRow
              label="Drying time for felt"
              value={state.rules.dryingHours}
              suffix="hrs"
              onChange={(v) => actions.updateRules({ dryingHours: v })}
              min={0}
              max={72}
              step={4}
            />
            <RuleRow
              label="Rush jobs per day"
              value={state.rules.rushPerDay}
              suffix="max"
              onChange={(v) => actions.updateRules({ rushPerDay: v })}
              min={0}
              max={6}
              step={1}
            />
            <RuleRow
              label="Saturday cap"
              value={state.rules.saturdayCap}
              suffix="hats"
              onChange={(v) => actions.updateRules({ saturdayCap: v })}
              min={1}
              max={14}
              step={1}
            />
            <RuleRow
              label="Deposit"
              value={state.rules.deposit}
              suffix="$"
              onChange={(v) => actions.updateRules({ deposit: v })}
              min={0}
              max={50}
              step={5}
            />
            <p className="font-mono text-xs text-muted-foreground">
              Hours: Thu–Sat 10–6, Tue–Wed by appointment, closed Sun–Mon.
            </p>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function HatCard({
  b,
  nextLabel,
  onAdvance,
}: {
  b: Booking;
  nextLabel?: string | undefined;
  onAdvance?: (() => void) | undefined;
}) {
  const svc = serviceById(b.serviceId);
  return (
     <article className="animate-tag rounded-sm border border-border bg-paper p-4 shadow-[var(--shadow-lift)]">
      <p className="font-display text-lg leading-tight">{b.name}</p>
      <p className="font-mono text-[11px] text-muted-foreground">
        {svc.name} · {b.shape.preset}
      </p>
       {b.branding?.text && <p className="font-mono text-[11px] text-muted-foreground">Brand: {b.branding.text} · {b.branding.placement === "band" ? "hatband" : b.branding.placement === "side" ? "side of hat" : "under brim"}</p>}
      <p className="font-mono text-[11px] text-muted-foreground">
        {fmtDay(b.start)} {fmtTime(b.start)} · {b.code}
      </p>
      {b.rush && (
        <p className="mt-1 inline-block bg-oxblood px-1.5 font-mono text-[10px] uppercase tracking-widest text-primary-foreground">
          rush
        </p>
      )}
      {b.notes && (
        <p className="mt-1 font-mono text-[10px] text-sage">{b.notes}</p>
      )}
      {onAdvance && (
         <Button variant="ghost"
          type="button"
          onClick={onAdvance}
          className="mt-2 min-h-11 w-full rounded-sm border border-foreground px-2 font-mono text-[11px] uppercase tracking-widest hover:bg-secondary"
        >
          {nextLabel}
         </Button>
      )}
    </article>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl leading-tight">{title}</h2>
      <p className="font-mono text-[11px] text-muted-foreground">{hint}</p>
       <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
     <p className="rounded-sm border border-dashed border-border p-4 font-mono text-xs text-muted-foreground">
      {children}
    </p>
  );
}

function RuleRow({
  label,
  value,
  suffix,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  suffix: string;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
     <div className="rounded-sm border border-border bg-paper p-4">
      <label htmlFor={id} className="flex items-baseline justify-between">
        <span>{label}</span>
        <span className="font-mono text-oxblood">
          {value} {suffix}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-11 w-full accent-[var(--color-oxblood)]"
      />
    </div>
  );
}

function TimeMachine({
  onAdvance,
  onSaturday,
  onReset,
}: {
  onAdvance: (ms: number) => void;
  onSaturday: () => void;
  onReset: () => void;
}) {
  return (
     <div className="rounded-sm border border-brass bg-secondary/60 p-4">
       <p className="px-1 font-mono text-[10px] uppercase tracking-[0.2em] text-green-ink">
        Time machine
      </p>
       <div className="mt-3 flex flex-wrap gap-2">
        <TMButton onClick={() => onAdvance(2 * HOUR)}>+2h</TMButton>
        <TMButton onClick={() => onAdvance(DAY)}>+24h</TMButton>
        <TMButton onClick={() => onAdvance(2 * DAY)}>+48h</TMButton>
        <TMButton onClick={onSaturday}>Next Saturday</TMButton>
        <TMButton onClick={onReset}>Reset demo</TMButton>
      </div>
    </div>
  );
}

function TMButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
     <Button variant="ghost"
      type="button"
      onClick={onClick}
      className="min-h-11 rounded-sm border border-border bg-paper px-3 font-mono text-xs uppercase tracking-widest hover:border-oxblood hover:text-oxblood"
    >
      {children}
     </Button>
  );
}
