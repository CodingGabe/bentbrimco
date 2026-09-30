import type { ReactNode } from "react";
import { HatProfile } from "./HatProfile";
import { fmtLongDay, fmtTime } from "@/lib/shop/time";
import { type Branding, type BrimShape, type Service } from "@/lib/shop/types";

export type TicketDraft = {
  service: Service | null;
  shape: BrimShape | null;
  branding?: Branding | null | undefined;
  material: "felt" | "straw" | null;
  size: string | null;
  deadline: string | null;
  start: string | null;
  mode: "dropoff" | "bar" | null;
  rush: boolean;
  name: string;
  phone: string;
  price: number;
  deposit: number;
  code?: string | undefined;
  pickupCode?: string | undefined;
};

function Line({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-foreground/20 py-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-green-ink">
        {label}
      </span>
      <span className="text-right font-mono text-sm text-foreground">
        {children}
      </span>
    </div>
  );
}

const blank = <span className="text-muted-foreground">— — —</span>;

export function ClaimTicket({
  draft,
  stamped = false,
  compact = false,
}: {
  draft: TicketDraft;
  stamped?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="animate-ticket relative">
      <div
        aria-hidden
        className="tear-edge h-2.5 w-full bg-paper"
      />
      <div className="paper-grain relative overflow-hidden px-5 pb-6 pt-4 shadow-[var(--shadow-bench)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-xl leading-none">Claim Ticket</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-green-ink">
              Bent Brim Co. · S Congress
            </p>
          </div>
          <p className="font-mono text-sm text-oxblood">
            {draft.code ?? "BB-••••"}
          </p>
        </div>

        <div aria-hidden className="hatband my-3 h-1.5 w-full opacity-80" />

        <Line label="Service">
          {draft.service ? draft.service.name : blank}
        </Line>
        <Line label="Shape">
          {draft.shape ? (
            <span className="inline-flex items-center gap-2">
              {draft.shape.preset}
              <HatProfile
                curve={draft.shape.curve}
                pinch={draft.shape.pinch}
                className="h-5 w-8 opacity-80"
                branding={draft.branding}
              />
            </span>
          ) : (
            blank
          )}
        </Line>
        {draft.shape && <Line label="Brim">{draft.shape.curve < 25 ? "Flat" : draft.shape.curve < 65 ? "Gentle curl" : "High roll"}</Line>}
        {draft.branding?.text && <Line label="Branding">{draft.branding.text} · {draft.branding.placement === "band" ? "hatband" : draft.branding.placement === "side" ? "side of hat" : "under brim"}</Line>}
        <Line label="Material">
          {draft.material ? (
            <>
              {draft.material === "felt" ? "Felt" : "Straw"}
              {draft.size ? ` · ${draft.size}` : ""}
            </>
          ) : (
            blank
          )}
        </Line>
        <Line label="Needed by">
          {draft.deadline ? fmtLongDay(draft.deadline) : "No rush"}
        </Line>
        <Line label="Bench time">
          {draft.start ? (
            <>
              {fmtLongDay(draft.start)}
              <br />
              {fmtTime(draft.start)} ·{" "}
              {draft.mode === "bar" ? "Bar session" : "Drop-off"}
            </>
          ) : (
            blank
          )}
        </Line>
        {!compact && (
          <>
            <Line label="Name">{draft.name || blank}</Line>
            <Line label="Mobile">{draft.phone || blank}</Line>
          </>
        )}
        <Line label="Total">
          {draft.price ? (
            <>
              ${draft.price}
              {draft.rush && (
                <span className="text-oxblood"> (rush +$25)</span>
              )}
            </>
          ) : (
            blank
          )}
        </Line>
        <Line label="Deposit">
          {draft.deposit
            ? `$${draft.deposit} ${draft.code ? "paid" : "at booking"}`
            : "$0"}
        </Line>
        {draft.pickupCode && (
          <Line label="Pickup code">
            <span className="text-lg tracking-[0.3em] text-oxblood">
              {draft.pickupCode}
            </span>
          </Line>
        )}

        {stamped && (
          <div
            aria-hidden
            className="animate-stamp pointer-events-none absolute -right-2 bottom-4 rounded-sm border-[3px] border-oxblood/70 px-3 py-1 font-display text-2xl uppercase tracking-tight text-oxblood/80"
          >
            Booked
          </div>
        )}

         <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-green-ink">
          Keep this half. Sol keeps the other.
        </p>
      </div>
      <div aria-hidden className="tear-edge h-2.5 w-full rotate-180 bg-paper" />
    </div>
  );
}
