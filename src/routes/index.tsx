import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BrimPicker } from "@/components/BrimPicker";
import { ClaimTicket, type TicketDraft } from "@/components/ClaimTicket";
import { HatProfile } from "@/components/HatProfile";
import { SiteFooter } from "@/components/SiteFooter";
import { Steam } from "@/components/Steam";
import { downloadIcs } from "@/lib/shop/ics";
import { buildAvailability } from "@/lib/shop/rules";
import { makePickupCode, makeTicketCode, nextId } from "@/lib/shop/seed";
import { useShop } from "@/lib/shop/store";
import { DAY, fmtLongDay, fmtTime, startOfDay } from "@/lib/shop/time";
import {
  PRESETS,
  RUSH_FEE,
  SERVICES,
  type Booking,
  type BrimShape,
  type Service,
} from "@/lib/shop/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bent Brim Co. — get your hat back in shape" },
      {
        name: "description",
        content:
          "Steam, crease, fit, and restore western hats on South Congress in Austin. Build your claim ticket in five steps and you're booked.",
      },
      { property: "og:title", content: "Bent Brim Co. — hat shaping, booked" },
      {
        property: "og:description",
        content:
          "Hat's lost its nerve? Build your claim ticket and Sol takes it from there. No login, no DM tag.",
      },
    ],
  }),
  component: Booker,
});

const STEP_LABELS = [
  "The hat",
  "The shape",
  "The day",
  "You",
  "Booked",
];

function Booker() {
  const { state, actions } = useShop();
  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [shape, setShape] = useState<BrimShape>({
    preset: "Cattleman",
    curve: PRESETS[0].curve,
    pinch: PRESETS[0].pinch,
  });
  const [material, setMaterial] = useState<"felt" | "straw">("felt");
  const [size, setSize] = useState("Not sure, Sol will measure");
  const [photoName, setPhotoName] = useState<string | undefined>();
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState<string>("");
  const [slot, setSlot] = useState<{
    start: string;
    mode: "dropoff" | "bar";
    rush: boolean;
  } | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reminders, setReminders] = useState(true);
  const [booked, setBooked] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const rush = slot?.rush ?? false;
  const price = (service?.price ?? 0) + (rush ? RUSH_FEE : 0);

  const draft: TicketDraft = {
    service,
    shape: step >= 1 ? shape : null,
    material: step >= 1 ? material : null,
    size: step >= 1 ? size : null,
    deadline: hasDeadline && deadline ? deadline : null,
    start: slot?.start ?? null,
    mode: slot?.mode ?? null,
    rush,
    name,
    phone,
    price,
    deposit: booked ? booked.deposit : (state?.rules.deposit ?? 15),
    code: booked?.code,
    pickupCode: booked?.pickupCode,
  };

  const availability = useMemo(() => {
    if (!state || !service) return [];
    return buildAvailability({
      now: state.now,
      serviceId: service.id,
      material,
      deadline: hasDeadline && deadline ? deadline : null,
      rules: state.rules,
      bookings: state.bookings,
    }).slice(0, 10);
  }, [state, service, material, hasDeadline, deadline]);

  function confirm() {
    if (!state || !service || !slot) return;
    if (name.trim().length < 2) return setError("Sol needs a name for the ticket.");
    if (phone.replace(/\D/g, "").length < 10)
      return setError("A mobile number with 10 digits, so the shop can text you.");
    setError(null);
    const b: Booking = {
      id: nextId("bk"),
      code: makeTicketCode(),
      pickupCode: makePickupCode(),
      name: name.trim(),
      phone: phone.trim(),
      serviceId: service.id,
      shape,
      material,
      size,
      photoName,
      deadline: hasDeadline && deadline ? deadline : null,
      rush,
      mode: slot.mode,
      start: slot.start,
      minutes: service.minutes,
      price,
      deposit: state.rules.deposit,
      status: rush ? "requested" : "booked",
      textReminders: reminders,
      firstTime: true,
      repliedToReminder: false,
      createdAt: state.now,
    };
    actions.addBooking(b);
    setBooked(b);
    setStep(4);
  }

  return (
    <div className="min-h-screen pb-40 md:pb-0">
      <div aria-hidden className="hatband h-2 w-full" />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="font-display text-xl tracking-tight">
          Bent Brim Co.
        </Link>
        <Link
          to="/shop"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-oxblood"
        >
          The Bench
        </Link>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-5 pt-4 md:grid-cols-[1.35fr_0.65fr] md:pt-8">
        <div>
          {step === 0 && (
            <section>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-oxblood">
                Steam · Crease · Fit · Restore
              </p>
              <h1 className="mt-3 max-w-xl text-6xl leading-[0.9] sm:text-7xl">
                Hat's lost
                <br />
                its nerve?
                <br />
                <span className="text-oxblood">We'll fix that.</span>
              </h1>
              <p className="mt-5 max-w-md text-lg text-muted-foreground">
                Eleven years at the steam kettle, one pair of hands. Tell me
                what's wrong and you'll walk out of here booked.
              </p>

              <h2 className="mt-12 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Step 1 · What's wrong with the hat?
              </h2>
              <ul className="mt-4 space-y-3">
                {SERVICES.map((s, i) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setService(s);
                        setSlot(null);
                        setStep(1);
                      }}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className="animate-tag group flex w-full items-center justify-between gap-4 rounded-sm border border-border bg-paper px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-oxblood hover:shadow-[var(--shadow-lift)]"
                    >
                      <span className="min-w-0">
                        <span className="block font-display text-2xl leading-tight">
                          {s.plain}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {s.note}
                        </span>
                      </span>
                      <span className="shrink-0 text-right font-mono text-sm">
                        <span className="block text-oxblood">${s.price}</span>
                        <span className="block text-xs text-muted-foreground">
                          {s.dropOffOnly ? "drop-off" : `${s.minutes} min`}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-mono text-xs text-muted-foreground">
                Need it by a date? Say so at step three — rush is +${RUSH_FEE},
                and only when the drying time actually allows it.
              </p>
            </section>
          )}

          {step === 1 && (
            <section>
              <StepHead n={2} title="How should it sit?" onBack={() => setStep(0)} />
              <p className="mt-2 max-w-md text-muted-foreground">
                Drag the brass handle until the profile looks like the hat in
                your head. Or snap to a crease with a name.
              </p>
              <div className="mt-6">
                <BrimPicker value={shape} onChange={setShape} />
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <fieldset>
                  <legend className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Felt or straw?
                  </legend>
                  <div className="mt-2 flex gap-2">
                    {(["felt", "straw"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={material === m}
                        onClick={() => {
                          setMaterial(m);
                          setSlot(null);
                        }}
                        className={`min-h-11 flex-1 rounded-sm border px-3 capitalize ${
                          material === m
                            ? "border-oxblood bg-oxblood text-primary-foreground"
                            : "border-border bg-paper"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Felt needs a day to set. We don't rush the crown.
                  </p>
                </fieldset>

                <div>
                  <label
                    htmlFor="size"
                    className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    Hat size
                  </label>
                  <select
                    id="size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="mt-2 min-h-11 w-full rounded-sm border border-border bg-paper px-3"
                  >
                    {[
                      "Not sure, Sol will measure",
                      "6 7/8",
                      "7",
                      "7 1/8",
                      "7 1/4",
                      "7 3/8",
                      "7 1/2",
                      "7 5/8",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="photo"
                  className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
                >
                  Photo of the hat (optional)
                </label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoName(e.target.files?.[0]?.name)}
                  className="mt-2 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-sm file:border file:border-border file:bg-secondary file:px-4 file:font-mono file:text-xs file:uppercase file:tracking-widest"
                />
                {photoName && (
                  <p className="mt-1 font-mono text-xs text-sage">
                    Attached: {photoName}
                  </p>
                )}
              </div>

              <NextButton onClick={() => setStep(2)}>
                That's the shape
              </NextButton>
            </section>
          )}

          {step === 2 && service && (
            <section>
              <StepHead n={3} title="When do you need it?" onBack={() => setStep(1)} />
              <div className="mt-5 rounded-sm border border-border bg-paper p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    aria-pressed={!hasDeadline}
                    onClick={() => {
                      setHasDeadline(false);
                      setSlot(null);
                    }}
                    className={`min-h-11 rounded-sm border px-4 ${!hasDeadline ? "border-oxblood bg-oxblood text-primary-foreground" : "border-border"}`}
                  >
                    No hard date
                  </button>
                  <button
                    type="button"
                    aria-pressed={hasDeadline}
                    onClick={() => {
                      setHasDeadline(true);
                      setSlot(null);
                      if (!deadline && state)
                        setDeadline(
                          startOfDay(new Date(new Date(state.now).getTime() + 4 * DAY))
                            .toISOString()
                            .slice(0, 10),
                        );
                    }}
                    className={`min-h-11 rounded-sm border px-4 ${hasDeadline ? "border-oxblood bg-oxblood text-primary-foreground" : "border-border"}`}
                  >
                    I need it by…
                  </button>
                  {hasDeadline && (
                    <label className="flex items-center gap-2">
                      <span className="sr-only">Deadline date</span>
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => {
                          setDeadline(e.target.value);
                          setSlot(null);
                        }}
                        className="min-h-11 rounded-sm border border-border bg-background px-3 font-mono"
                      />
                    </label>
                  )}
                </div>
                {hasDeadline && material === "felt" && (
                  <p className="mt-3 border-l-2 border-brass pl-3 text-sm text-muted-foreground">
                    Felt needs a full day to set after steaming, so anything
                    that can't dry in time won't show up below.
                  </p>
                )}
              </div>

              {!state ? (
                <p className="mt-8 font-mono text-sm text-muted-foreground">
                  Pulling the book off the wall…
                </p>
              ) : (
                <div className="mt-8 space-y-6">
                  {availability.map((day) => (
                    <div key={day.date}>
                      <div className="flex items-baseline gap-3">
                        <h3 className="font-display text-2xl">
                          {fmtLongDay(day.date)}
                        </h3>
                        <span
                          aria-hidden
                          className="h-px flex-1 bg-border"
                          style={{
                            backgroundImage:
                              "repeating-linear-gradient(90deg, var(--color-border) 0 6px, transparent 6px 10px)",
                          }}
                        />
                      </div>
                      {day.slots.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {day.slots.map((s, i) => {
                            const active = slot?.start === s.start;
                            return (
                              <button
                                key={s.start}
                                type="button"
                                onClick={() => setSlot(s)}
                                aria-pressed={active}
                                style={{ animationDelay: `${i * 40}ms` }}
                                className={`animate-tag min-h-11 rounded-sm border px-3 py-2 text-left font-mono text-sm ${
                                  active
                                    ? "border-oxblood bg-oxblood text-primary-foreground"
                                    : "border-border bg-paper hover:border-oxblood/60"
                                }`}
                              >
                                <span className="block">{fmtTime(s.start)}</span>
                                <span
                                  className={`block text-[10px] uppercase tracking-widest ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}
                                >
                                  {s.mode === "bar" ? "Bar session" : "Drop-off"}
                                  {s.rush ? " · rush" : ""}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {day.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {slot && (
                <NextButton onClick={() => setStep(3)}>
                  Hold {fmtTime(slot.start)}{" "}
                  {slot.rush ? `(rush, +$${RUSH_FEE})` : ""}
                </NextButton>
              )}
            </section>
          )}

          {step === 3 && (
            <section>
              <StepHead n={4} title="Your half of the ticket" onBack={() => setStep(2)} />
              <form
                className="mt-6 max-w-md space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  confirm();
                }}
              >
                <div>
                  <label htmlFor="name" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="mt-2 min-h-12 w-full rounded-sm border border-border bg-paper px-3"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Mobile
                  </label>
                  <input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="512-555-0100"
                    className="mt-2 min-h-12 w-full rounded-sm border border-border bg-paper px-3 font-mono"
                  />
                </div>
                <label className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={reminders}
                    onChange={(e) => setReminders(e.target.checked)}
                    className="h-5 w-5 accent-[var(--color-oxblood)]"
                  />
                  <span className="text-sm">
                    Text me the reminders. No login. You've got enough to
                    remember.
                  </span>
                </label>

                <div className="rounded-sm border border-brass/60 bg-secondary/70 p-4">
                  <p className="font-display text-xl">
                    ${state?.rules.deposit ?? 15} deposit
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Deposit holds your spot and comes off your total.
                    Reschedule free up to 24 hours before. Card's simulated —
                    this is a demo shop.
                  </p>
                </div>

                {error && (
                  <p role="alert" className="font-mono text-sm text-oxblood">
                    {error}
                  </p>
                )}

                <div className="relative">
                  <Steam />
                  <button
                    type="submit"
                    className="min-h-12 w-full rounded-sm bg-oxblood px-5 font-display text-xl text-primary-foreground transition-transform hover:-translate-y-0.5"
                  >
                    Pay ${state?.rules.deposit ?? 15} and tear the ticket
                  </button>
                </div>
              </form>
            </section>
          )}

          {step === 4 && booked && (
            <section>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-oxblood">
                Step 5 · Done
              </p>
              <h1 className="mt-3 text-6xl leading-[0.9]">
                You're booked.
                <br />
                <span className="text-muted-foreground">
                  {booked.status === "requested" ? "Pending Sol's nod." : "Kettle's on."}
                </span>
              </h1>
              <p className="mt-4 max-w-md text-lg text-muted-foreground">
                {booked.status === "requested"
                  ? "Rush jobs get a human look. Sol confirms within the hour, and you'll get a text either way."
                  : "Ticket's on your phone. Nothing else to do but show up."}
              </p>

              <dl className="mt-8 grid max-w-md grid-cols-2 gap-4 font-mono text-sm">
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Ticket
                  </dt>
                  <dd className="text-lg text-oxblood">{booked.code}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Pickup code
                  </dt>
                  <dd className="text-lg tracking-[0.3em] text-oxblood">
                    {booked.pickupCode}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Where
                  </dt>
                  <dd>1512 S Congress Ave, Austin</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => downloadIcs(booked)}
                  className="min-h-12 rounded-sm border border-foreground px-5 font-mono text-sm uppercase tracking-widest hover:bg-secondary"
                >
                  Add to calendar
                </button>
                <Link
                  to="/t/$code"
                  params={{ code: booked.code }}
                  className="flex min-h-12 items-center rounded-sm bg-oxblood px-5 font-mono text-sm uppercase tracking-widest text-primary-foreground"
                >
                  Reschedule or cancel
                </Link>
              </div>

              <div className="mt-8 max-w-md rounded-sm border border-border bg-secondary/60 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Text just sent to {booked.phone}
                </p>
                <p className="mt-2 rounded-sm bg-paper p-3 font-mono text-sm">
                  Bent Brim Co. — ticket {booked.code}. {service?.name},{" "}
                  {fmtLongDay(booked.start)} at {fmtTime(booked.start)}. 1512 S
                  Congress. Deposit ${booked.deposit} is off your total.
                </p>
              </div>

              <p className="mt-8">
                <Link
                  to="/shop"
                  className="underline decoration-brass underline-offset-4 hover:text-oxblood"
                >
                  Watch it land on Sol's bench →
                </Link>
              </p>
            </section>
          )}
        </div>

        {/* Ticket: side rail on desktop */}
        <aside className="hidden md:block">
          <div className="sticky top-8">
            <Progress step={step} />
            <div className="mt-4">
              <ClaimTicket draft={draft} stamped={step === 4} />
            </div>
          </div>
        </aside>
      </main>

      {/* Ticket: bottom sheet on mobile */}
      <div className="fixed inset-x-0 bottom-0 z-20 md:hidden">
        {sheetOpen && (
          <div className="max-h-[70vh] overflow-y-auto border-t border-border bg-background px-4 pb-4 pt-3">
            <ClaimTicket draft={draft} stamped={step === 4} />
          </div>
        )}
        <button
          type="button"
          onClick={() => setSheetOpen((v) => !v)}
          aria-expanded={sheetOpen}
          className="flex min-h-14 w-full items-center justify-between border-t-2 border-foreground bg-paper px-4 text-left"
        >
          <span>
            <span className="block font-display text-lg leading-tight">
              Your claim ticket
            </span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {STEP_LABELS[step]} · step {Math.min(step + 1, 5)} of 5
            </span>
          </span>
          <HatProfile curve={shape.curve} pinch={shape.pinch} className="h-8 w-12" />
        </button>
      </div>

      <SiteFooter />
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <ol className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.18em]">
      {STEP_LABELS.map((l, i) => (
        <li
          key={l}
          className={
            i === step
              ? "text-oxblood"
              : i < step
                ? "text-foreground"
                : "text-muted-foreground/60"
          }
        >
          {i < step ? "✓ " : ""}
          {l}
        </li>
      ))}
    </ol>
  );
}

function StepHead({
  n,
  title,
  onBack,
}: {
  n: number;
  title: string;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="min-h-11 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-oxblood"
      >
        ← Back
      </button>
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-oxblood">
        Step {n}
      </p>
      <h1 className="mt-2 text-5xl leading-[0.95]">{title}</h1>
    </div>
  );
}

function NextButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mt-10 inline-block">
      <Steam />
      <button
        type="button"
        onClick={onClick}
        className="min-h-12 rounded-sm bg-oxblood px-6 font-display text-xl text-primary-foreground transition-transform hover:-translate-y-0.5"
      >
        {children}
      </button>
    </div>
  );
}
