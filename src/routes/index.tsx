import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { BrimPicker } from "@/components/BrimPicker";
import { ClaimTicket, type TicketDraft } from "@/components/ClaimTicket";
import { HatProfile } from "@/components/HatProfile";
import { SiteFooter } from "@/components/SiteFooter";
import { Steam } from "@/components/Steam";
import heroPhoto from "@/assets/RKM-131.jpg.asset.json";
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
          "Steam, crease, fit, and restore western hats on South Congress in Austin. Shape your hat, pick your time, and book.",
      },
      { property: "og:title", content: "Bent Brim Co. — hat shaping, booked" },
      {
        property: "og:description",
        content:
          "Hat's lost its nerve? Build your claim ticket and Sol takes it from there. No login, no DM tag.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Booker,
});

const STEP_LABELS = [
  "The hat",
  "The shape",
  "The brim",
  "Branding",
  "The day",
  "You",
  "Booked",
];

function Booker() {
  const { state, actions } = useShop();
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [shape, setShape] = useState<BrimShape>({
    preset: "Cattleman",
    curve: PRESETS[0]!.curve,
    pinch: PRESETS[0]!.pinch,
  });
  const [branding, setBranding] = useState<{ text: string; placement: "band" | "underbrim" | "side" } | null>(null);
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
    branding,
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
      branding: branding?.text.trim() ? { ...branding, text: branding.text.trim() } : null,
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
    setStep(6);
  }

  return (
    <div className="min-h-screen pb-40 md:pb-0">
      <div className="border-b border-border bg-secondary py-2 text-center text-xs font-medium uppercase text-foreground">
        Shaped by hand on South Congress · Austin, Texas
      </div>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="font-display text-3xl uppercase leading-none sm:text-4xl">
            Bent Brim Co.
          </Link>
          <nav className="flex items-center gap-4 text-xs font-semibold uppercase sm:gap-8 sm:text-sm" aria-label="Main navigation">
            <Link to="/" className="hover:text-oxblood">Book a hat</Link>
            <Link to="/shop" className="hover:text-oxblood">The Bench</Link>
            <Link to="/about" className="hidden hover:text-oxblood sm:block">Our story</Link>
          </nav>
        </div>
      </header>

      {step === 0 && (
        <section className="relative isolate flex min-h-[340px] items-end overflow-hidden bg-felt sm:min-h-[410px]" aria-label="Bent Brim western hat photograph">
          <img src={heroPhoto.url} alt="A cowboy in a black western hat sitting beside a horse" width={2000} height={1333} className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,var(--hero-shade),transparent_75%)]" />
          <div className="mx-auto w-full max-w-7xl px-5 pb-8 pt-20 text-primary-foreground sm:pb-12">
            <p className="text-xs font-semibold uppercase text-green-on-dark">Steam · Crease · Fit · Restore</p>
            <h1 className="mt-3 max-w-2xl font-display text-5xl uppercase leading-none sm:text-7xl">Good hats get a second life.</h1>
            <p className="mt-3 max-w-lg text-base sm:text-lg">Eleven years at the steam kettle. One pair of hands. Tell us what your hat needs.</p>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-7xl px-5 pt-8 md:pt-12">
        <Journey step={step} onSelect={setStep} />
        <div className="mt-8 grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_320px] md:gap-12 lg:gap-16">
        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -16, scale: 0.985 }} transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}>
          {step === 0 && (
            <section>
              <p className="text-xs font-semibold uppercase text-green-ink">01 / Choose your service</p>
              <h2 className="mt-2 font-display text-3xl uppercase leading-none sm:text-4xl">
                What does your hat need?
              </h2>
              <ul className="mt-6 divide-y divide-border border-y border-border">
                {SERVICES.map((s, i) => (
                  <li key={s.id}>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        setService(s);
                        setSlot(null);
                        setStep(1);
                      }}
                      style={{ animationDelay: `${i * 60}ms` }}
                       className="group flex h-auto min-h-20 w-full items-center justify-between gap-4 whitespace-normal px-2 py-5 text-left transition-colors hover:bg-secondary sm:px-4"
                    >
                      <span className="min-w-0">
                        <span className="block font-display text-2xl uppercase leading-tight">
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
                    </Button>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-muted-foreground">
                Need it by a date? Tell us when you pick your time — rush is +${RUSH_FEE},
                and only when the drying time actually allows it.
              </p>
            </section>
          )}

          {step === 1 && (
            <section>
              <StepHead n={2} title="Shape the crown" onBack={() => setStep(0)} />
              <p className="mt-2 max-w-md text-muted-foreground">
                Drag the green handle to shape the crown, or choose a familiar crease.
              </p>
              <div className="mt-6">
                <BrimPicker value={shape} onChange={setShape} />
              </div>

               <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <fieldset>
                  <legend className="font-mono text-xs uppercase tracking-[0.2em] text-green-ink">
                    Felt or straw?
                  </legend>
                  <div className="mt-2 flex gap-2">
                    {(["felt", "straw"] as const).map((m) => (
                      <Button
                      variant="ghost"
                        key={m}
                        type="button"
                        aria-pressed={material === m}
                        onClick={() => {
                          setMaterial(m);
                          setSlot(null);
                        }}
                        className={`min-h-11 flex-1 rounded-sm border px-3 capitalize ${
                           material === m
                             ? "border-oxblood bg-oxblood text-primary-foreground hover:bg-oxblood hover:text-primary-foreground"
                            : "border-border bg-paper"
                        }`}
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Felt needs a day to set. We don't rush the crown.
                  </p>
                </fieldset>

                <div>
                  <label
                    htmlFor="size"
                    className="font-mono text-xs uppercase tracking-[0.2em] text-green-ink"
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
                  className="font-mono text-xs uppercase tracking-[0.2em] text-green-ink"
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
                Next: the brim
              </NextButton>
            </section>
          )}

          {step === 2 && (
            <section>
              <StepHead n={3} title="Shape the brim" onBack={() => setStep(1)} />
              <p className="mt-2 max-w-md text-muted-foreground">Optional. Leave the brim as shown, or choose how much curl you want.</p>
              <div className="mt-6 bg-secondary/60 p-5 sm:p-8">
                <HatProfile curve={shape.curve} pinch={shape.pinch} className="mx-auto h-56 w-full max-w-md" />
              </div>
              <fieldset className="mt-6">
                <legend className="text-xs font-semibold uppercase text-green-ink">Brim profile</legend>
                 <div className="mt-3 grid grid-cols-3 gap-3">
                  {([{ label: "Flat", curve: 15 }, { label: "Gentle curl", curve: 45 }, { label: "High roll", curve: 85 }] as const).map((option) => (
                      <Button variant="ghost" key={option.label} type="button" aria-pressed={Math.abs(shape.curve - option.curve) < 15} onClick={() => setShape({ ...shape, curve: option.curve, preset: "Your own thing" })} className={`h-auto min-h-12 whitespace-normal rounded-sm border px-3 py-2 text-center text-sm font-medium ${Math.abs(shape.curve - option.curve) < 15 ? "border-foreground bg-green text-foreground hover:bg-green hover:text-foreground" : "border-border bg-paper"}`}>
                      {option.label}
                    </Button>
                  ))}
                </div>
                <label htmlFor="brim-curve" className="mt-6 flex justify-between text-xs font-semibold uppercase text-green-ink"><span>Brim curl</span><span>{shape.curve}%</span></label>
                <input id="brim-curve" type="range" min="0" max="100" value={shape.curve} onChange={(e) => setShape({ ...shape, curve: Number(e.target.value), preset: "Your own thing" })} className="mt-2 h-11 w-full accent-[var(--color-green)]" />
              </fieldset>
              <NextButton onClick={() => setStep(3)}>Next: branding</NextButton>
            </section>
          )}

          {step === 3 && (
            <section>
              <StepHead n={4} title="Make it yours" onBack={() => setStep(2)} />
              <p className="mt-2 max-w-md text-muted-foreground">Branding is optional. Add short initials or a name for Sol to mark on the hat.</p>
              <div className="mt-6 bg-secondary/60 p-5 sm:p-8">
                <HatProfile curve={shape.curve} pinch={shape.pinch} branding={branding} className="mx-auto h-56 w-full max-w-md" />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                 <Button variant="ghost" type="button" aria-pressed={!branding} onClick={() => setBranding(null)} className={`min-h-11 rounded-sm border px-4 ${!branding ? "border-foreground bg-green text-foreground hover:bg-green hover:text-foreground" : "border-border bg-paper"}`}>No branding</Button>
                 <Button variant="ghost" type="button" aria-pressed={!!branding} onClick={() => setBranding(branding ?? { text: "", placement: "band" })} className={`min-h-11 rounded-sm border px-4 ${branding ? "border-foreground bg-green text-foreground hover:bg-green hover:text-foreground" : "border-border bg-paper"}`}>Add branding</Button>
              </div>
              {branding && <div className="mt-6 max-w-md space-y-5">
                <div><label htmlFor="brand-text" className="text-xs font-semibold uppercase text-green-ink">Initials or short name</label><input id="brand-text" maxLength={12} value={branding.text} onChange={(e) => setBranding({ ...branding, text: e.target.value })} placeholder="e.g. J.R." className="mt-2 min-h-12 w-full rounded-sm border border-border bg-paper px-3" /></div>
                 <fieldset><legend className="text-xs font-semibold uppercase text-green-ink">Placement</legend><div className="mt-3 grid grid-cols-3 gap-3">{([{ value: "band", label: "Hatband" }, { value: "side", label: "Side of hat" }, { value: "underbrim", label: "Under brim" }] as const).map((p) => <Button variant="ghost" key={p.value} type="button" aria-pressed={branding.placement === p.value} onClick={() => setBranding({ ...branding, placement: p.value })} className={`h-auto min-h-12 flex-1 whitespace-normal rounded-sm border px-2 py-2 text-center ${branding.placement === p.value ? "border-foreground bg-green text-foreground hover:bg-green hover:text-foreground" : "border-border bg-paper"}`}>{p.label}</Button>)}</div></fieldset>
              </div>}
              <NextButton onClick={() => setStep(4)}>Next: pick a time</NextButton>
            </section>
          )}

          {step === 4 && service && (
            <section>
              <StepHead n={5} title="When do you need it?" onBack={() => setStep(3)} />
              <div className="mt-5 rounded-sm border border-border bg-paper p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                      variant="ghost"
                    type="button"
                    aria-pressed={!hasDeadline}
                    onClick={() => {
                      setHasDeadline(false);
                      setSlot(null);
                    }}
                     className={`min-h-11 rounded-sm border px-4 ${!hasDeadline ? "border-oxblood bg-oxblood text-primary-foreground hover:bg-oxblood hover:text-primary-foreground" : "border-border"}`}
                  >
                    No hard date
                  </Button>
                  <Button
                      variant="ghost"
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
                     className={`min-h-11 rounded-sm border px-4 ${hasDeadline ? "border-oxblood bg-oxblood text-primary-foreground hover:bg-oxblood hover:text-primary-foreground" : "border-border"}`}
                  >
                    I need it by…
                  </Button>
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
                              <Button
                      variant="ghost"
                                key={s.start}
                                type="button"
                                onClick={() => setSlot(s)}
                                aria-pressed={active}
                                style={{ animationDelay: `${i * 40}ms` }}
                                className={`animate-tag min-h-11 rounded-sm border px-3 py-2 text-left font-mono text-sm ${
                                  active
                                     ? "border-oxblood bg-oxblood text-primary-foreground hover:bg-oxblood hover:text-primary-foreground"
                                    : "border-border bg-paper hover:border-oxblood/60"
                                }`}
                              >
                                <span className="block">{fmtTime(s.start)}</span>
                                <span
                                  className={`block text-[10px] uppercase tracking-widest ${active ? "text-primary-foreground" : "text-muted-foreground"}`}
                                >
                                  {s.mode === "bar" ? "Bar session" : "Drop-off"}
                                  {s.rush ? " · rush" : ""}
                                </span>
                              </Button>
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
                <NextButton onClick={() => setStep(5)}>
                  Hold {fmtTime(slot.start)}{" "}
                  {slot.rush ? `(rush, +$${RUSH_FEE})` : ""}
                </NextButton>
              )}
            </section>
          )}

          {step === 5 && (
            <section>
              <StepHead n={6} title="Your half of the ticket" onBack={() => setStep(4)} />
              <form
                className="mt-6 max-w-md space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  confirm();
                }}
              >
                <div>
                  <label htmlFor="name" className="font-mono text-xs uppercase tracking-[0.2em] text-green-ink">
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
                  <label htmlFor="phone" className="font-mono text-xs uppercase tracking-[0.2em] text-green-ink">
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
                  <Button
                      variant="ghost"
                    type="submit"
                    className="min-h-12 w-full rounded-sm bg-oxblood px-5 font-display text-xl text-primary-foreground transition-transform hover:-translate-y-0.5"
                  >
                    Pay ${state?.rules.deposit ?? 15} and tear the ticket
                  </Button>
                </div>
              </form>
            </section>
          )}

          {step === 6 && booked && (
            <section>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-green-ink">
                 Step 7 · Done
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
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-green-ink">
                    Ticket
                  </dt>
                  <dd className="text-lg text-oxblood">{booked.code}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-green-ink">
                    Pickup code
                  </dt>
                  <dd className="text-lg tracking-[0.3em] text-oxblood">
                    {booked.pickupCode}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-green-ink">
                    Where
                  </dt>
                  <dd>1512 S Congress Ave, Austin</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                      variant="ghost"
                  type="button"
                  onClick={() => downloadIcs(booked)}
                  className="min-h-12 rounded-sm border border-foreground px-5 font-mono text-sm uppercase tracking-widest hover:bg-secondary"
                >
                  Add to calendar
                </Button>
                <Link
                  to="/t/$code"
                  params={{ code: booked.code }}
                  className="flex min-h-12 items-center rounded-sm bg-oxblood px-5 font-mono text-sm uppercase tracking-widest text-primary-foreground"
                >
                  Reschedule or cancel
                </Link>
              </div>

              <div className="mt-8 max-w-md rounded-sm border border-border bg-secondary/60 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-green-ink">
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
          </motion.div>
          </AnimatePresence>
        </div>

        {/* Ticket: side rail on desktop */}
        <aside className="hidden border-l border-border pl-8 md:block">
          <div className="sticky top-8">
            <div>
              <ClaimTicket draft={draft} stamped={step === 6} />
            </div>
          </div>
        </aside>
        </div>
      </main>

      {/* Ticket: bottom sheet on mobile */}
      <div className="fixed inset-x-0 bottom-0 z-20 md:hidden">
        {sheetOpen && (
          <div className="max-h-[70vh] overflow-y-auto border-t border-border bg-background px-4 pb-4 pt-3">
            <ClaimTicket draft={draft} stamped={step === 6} />
          </div>
        )}
        <Button
                      variant="ghost"
          type="button"
          onClick={() => setSheetOpen((v) => !v)}
          aria-expanded={sheetOpen}
          className="flex min-h-14 w-full items-center justify-between border-t-2 border-foreground bg-paper px-4 text-left"
        >
          <span>
            <span className="block font-display text-lg leading-tight">
              Your claim ticket
            </span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-green-ink">
               {STEP_LABELS[step]} · step {Math.min(step + 1, 7)} of 7
            </span>
          </span>
          <HatProfile curve={shape.curve} pinch={shape.pinch} className="h-8 w-12" branding={branding} />
        </Button>
      </div>

      <SiteFooter />
    </div>
  );
}

function Journey({ step, onSelect }: { step: number; onSelect: (step: number) => void }) {
  const navRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    navRef.current?.scrollTo({ left: Math.max(0, (step - 1) * 90), behavior: reducedMotion ? "instant" : "smooth" });
  }, [step, reducedMotion]);
  return (
    <nav ref={navRef} aria-label="Booking progress" className="overflow-x-auto pb-2">
      <div className="relative flex min-w-[630px] items-start justify-between px-2 pt-3">
        <div aria-hidden className="booking-rope absolute left-[7%] right-[7%] top-[25px] h-[3px] opacity-60" />
        <motion.div aria-hidden className="booking-rope absolute left-[7%] top-[25px] h-[3px] w-[86%] origin-left" initial={false} animate={{ scaleX: step / 6 }} transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }} />
        {STEP_LABELS.map((label, i) => (
          <Button variant="ghost" key={label} type="button" disabled={i > step || i === step} onClick={() => onSelect(i)} aria-current={i === step ? "step" : undefined} className={`relative z-10 flex h-auto w-[88px] flex-col gap-1.5 whitespace-normal rounded-none p-0 text-center font-mono text-[11px] font-semibold uppercase leading-tight disabled:opacity-100 hover:bg-transparent hover:text-green-ink ${i === step ? "text-green-ink" : "text-foreground"}`}>
            <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold ${i === step ? "border-foreground bg-foreground text-primary-foreground" : i < step ? "border-foreground bg-green text-foreground" : "border-foreground bg-background text-foreground"}`}>
              {i + 1}
            </span>
            <span>{label}</span>
          </Button>
        ))}
      </div>
    </nav>
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
      <Button
                      variant="ghost"
        type="button"
        onClick={onBack}
        className="min-h-11 font-mono text-xs uppercase tracking-[0.2em] text-green-ink hover:text-oxblood"
      >
        ← Back
      </Button>
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-green-ink">
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
      <Button
                      variant="ghost"
        type="button"
        onClick={onClick}
        className="min-h-12 rounded-sm bg-oxblood px-6 font-display text-xl text-primary-foreground transition-transform hover:-translate-y-0.5"
      >
        {children}
      </Button>
    </div>
  );
}
