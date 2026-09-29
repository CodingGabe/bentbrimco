import { useCallback, useEffect, useState } from "react";
import {
  type Booking,
  type ShopMessage,
  type ShopState,
  serviceById,
} from "./types";
import { DAY, HOUR } from "./time";
import { messageBody } from "./messages";
import { makePickupCode, makeTicketCode, nextId, seedState } from "./seed";

const KEY = "bentbrim.state.v1";

let state: ShopState | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined" || !state) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: demo keeps running in memory */
  }
}

export function loadState(): ShopState {
  if (state) return state;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        state = JSON.parse(raw) as ShopState;
        return state;
      }
    } catch {
      /* fall through to seed */
    }
  }
  state = seedState();
  persist();
  return state;
}

function setState(next: ShopState) {
  state = next;
  persist();
  emit();
}

export function resetDemo() {
  setState(seedState());
}

/* ---------------- automation ---------------- */

function send(
  st: ShopState,
  b: Booking,
  kind: ShopMessage["kind"],
  at: string,
): ShopState {
  const msg: ShopMessage = {
    id: nextId("msg"),
    bookingId: b.id,
    to: b.phone,
    kind,
    body: messageBody(kind, b),
    sentAt: at,
  };
  return {
    ...st,
    messages: [msg, ...st.messages],
    automatedActions: st.automatedActions + 1,
  };
}

function alreadySent(st: ShopState, bookingId: string, kind: string) {
  return st.messages.some((m) => m.bookingId === bookingId && m.kind === kind);
}

export function runAutomation(input: ShopState): ShopState {
  let st = input;
  const now = new Date(st.now).getTime();

  for (const b of [...st.bookings]) {
    const start = new Date(b.start).getTime();
    const current = () => st.bookings.find((x) => x.id === b.id)!;

    const update = (patch: Partial<Booking>) => {
      st = {
        ...st,
        bookings: st.bookings.map((x) =>
          x.id === b.id ? { ...x, ...patch } : x,
        ),
      };
    };

    if (["cancelled", "picked", "noshow", "requested"].includes(b.status)) {
      if (b.status === "picked" && b.pickedAt) {
        const picked = new Date(b.pickedAt).getTime();
        if (now >= picked + 2 * HOUR && !alreadySent(st, b.id, "review")) {
          st = send(st, current(), "review", st.now);
        }
      }
      continue;
    }

    if (b.textReminders && b.status === "booked") {
      if (now >= start - 48 * HOUR && !alreadySent(st, b.id, "heads-up-48"))
        st = send(st, current(), "heads-up-48", st.now);
      if (now >= start - 24 * HOUR && !alreadySent(st, b.id, "confirm-24"))
        st = send(st, current(), "confirm-24", st.now);
      if (now >= start - 2 * HOUR && !alreadySent(st, b.id, "soon-2"))
        st = send(st, current(), "soon-2", st.now);
    }

    // no-show: risky booking passes its slot without a reply
    if (
      b.status === "booked" &&
      now > start + 20 * 60000 &&
      !b.repliedToReminder &&
      b.deposit === 0
    ) {
      update({ status: "noshow" });
      st = offerToWaitlist(st, b.start);
      continue;
    }

    if (b.status === "booked" && now >= start) update({ status: "block" });

    const b2 = current();
    if (b2.status === "block" && now >= start + b2.minutes * 60000) {
      const needsDrying = b2.material === "felt";
      update(
        needsDrying
          ? { status: "drying" }
          : { status: "ready", readyAt: st.now },
      );
      if (!needsDrying && !alreadySent(st, b.id, "ready"))
        st = send(st, current(), "ready", st.now);
    }

    const b3 = current();
    if (
      b3.status === "drying" &&
      now >= start + b3.minutes * 60000 + st.rules.dryingHours * HOUR
    ) {
      update({ status: "ready", readyAt: st.now });
      if (!alreadySent(st, b.id, "ready"))
        st = send(st, current(), "ready", st.now);
    }

    const b4 = current();
    if (
      b4.status === "ready" &&
      b4.readyAt &&
      now >= new Date(b4.readyAt).getTime() + 7 * DAY &&
      !alreadySent(st, b.id, "nudge-7")
    ) {
      st = send(st, current(), "nudge-7", st.now);
    }
  }

  st = settleWaitlist(st);
  return st;
}

function offerToWaitlist(st: ShopState, slotIso: string): ShopState {
  const next = st.waitlist.find((w) => !w.notifiedFor && !w.claimed);
  if (!next) return st;
  const msg: ShopMessage = {
    id: nextId("msg"),
    bookingId: null,
    to: next.phone,
    kind: "waitlist-offer",
    body: `Opening just came up. Reply YES to take it. First reply wins.`,
    sentAt: st.now,
  };
  return {
    ...st,
    messages: [msg, ...st.messages],
    automatedActions: st.automatedActions + 1,
    waitlist: st.waitlist.map((w) =>
      w.id === next.id ? { ...w, notifiedFor: slotIso } : w,
    ),
  };
}

export function releaseSlot(st: ShopState, slotIso: string) {
  return offerToWaitlist(st, slotIso);
}

/** First reply wins: 30 simulated minutes after an offer, the waitlister claims it. */
function settleWaitlist(st: ShopState): ShopState {
  const now = new Date(st.now).getTime();
  let out = st;
  for (const w of st.waitlist) {
    if (!w.notifiedFor || w.claimed) continue;
    const offer = out.messages.find(
      (m) => m.kind === "waitlist-offer" && m.to === w.phone,
    );
    if (!offer) continue;
    if (now < new Date(offer.sentAt).getTime() + 30 * 60000) continue;
    if (now < new Date(w.notifiedFor).getTime()) {
      const svc = serviceById("reshape");
      const booking: Booking = {
        id: nextId("bk"),
        code: makeTicketCode(),
        pickupCode: makePickupCode(),
        name: w.name,
        phone: w.phone,
        serviceId: "reshape",
        shape: { preset: "Cattleman", curve: 42, pinch: 58 },
        material: "felt",
        size: "Not sure",
        deadline: null,
        rush: false,
        mode: "bar",
        start: w.notifiedFor,
        minutes: svc.minutes,
        price: svc.price,
        deposit: out.rules.deposit,
        status: "booked",
        textReminders: true,
        firstTime: true,
        repliedToReminder: true,
        createdAt: out.now,
        notes: "Filled from the waitlist, automatically.",
      };
      out = {
        ...out,
        bookings: [...out.bookings, booking],
        waitlist: out.waitlist.map((x) =>
          x.id === w.id ? { ...x, claimed: true } : x,
        ),
        automatedActions: out.automatedActions + 1,
      };
      out = send(out, booking, "confirmation", out.now);
    } else {
      out = {
        ...out,
        waitlist: out.waitlist.map((x) =>
          x.id === w.id ? { ...x, claimed: true } : x,
        ),
      };
    }
  }
  return out;
}

/* ---------------- actions ---------------- */

export const actions = {
  advance(ms: number) {
    const st = loadState();
    setState(runAutomation({ ...st, now: new Date(new Date(st.now).getTime() + ms).toISOString() }));
  },
  advanceTo(iso: string) {
    const st = loadState();
    setState(runAutomation({ ...st, now: iso }));
  },
  addBooking(b: Booking) {
    const st = loadState();
    let next: ShopState = { ...st, bookings: [...st.bookings, b] };
    next = send(next, b, "confirmation", st.now);
    setState(next);
  },
  setStatus(id: string, status: Booking["status"]) {
    const st = loadState();
    let next = {
      ...st,
      bookings: st.bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              status,
              readyAt: status === "ready" ? st.now : b.readyAt,
              pickedAt: status === "picked" ? st.now : b.pickedAt,
            }
          : b,
      ),
    };
    const b = next.bookings.find((x) => x.id === id);
    if (b && status === "ready" && !alreadySent(next, id, "ready"))
      next = send(next, b, "ready", st.now);
    if (b && status === "cancelled") {
      next = send(next, b, "cancelled", st.now);
      next = offerToWaitlist(next, b.start);
    }
    setState(next);
  },
  reschedule(id: string, startIso: string) {
    const st = loadState();
    const old = st.bookings.find((b) => b.id === id);
    let next = {
      ...st,
      bookings: st.bookings.map((b) =>
        b.id === id ? { ...b, start: startIso, status: "booked" as const } : b,
      ),
      messages: st.messages.filter(
        (m) =>
          !(
            m.bookingId === id &&
            ["heads-up-48", "confirm-24", "soon-2"].includes(m.kind)
          ),
      ),
    };
    if (old) next = offerToWaitlist(next, old.start);
    setState(next);
  },
  markReplied(id: string) {
    const st = loadState();
    setState({
      ...st,
      bookings: st.bookings.map((b) =>
        b.id === id ? { ...b, repliedToReminder: true } : b,
      ),
    });
  },
  approveRequest(id: string) {
    const st = loadState();
    const b = st.bookings.find((x) => x.id === id);
    let next: ShopState = {
      ...st,
      bookings: st.bookings.map((x) =>
        x.id === id ? { ...x, status: "booked" as const } : x,
      ),
    };
    if (b) next = send(next, b, "confirmation", st.now);
    setState(next);
  },
  updateRules(patch: Partial<ShopState["rules"]>) {
    const st = loadState();
    setState({ ...st, rules: { ...st.rules, ...patch } });
  },
  addWaitlist(name: string, phone: string, wants: string) {
    const st = loadState();
    setState({
      ...st,
      waitlist: [
        ...st.waitlist,
        { id: nextId("wl"), name, phone, wants, addedAt: st.now },
      ],
    });
  },
  reset: resetDemo,
};

/* ---------------- hook ---------------- */

export function useShop() {
  const [snapshot, setSnapshot] = useState<ShopState | null>(null);

  useEffect(() => {
    const sync = () => setSnapshot(loadState());
    sync();
    listeners.add(sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        state = null;
        sync();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const refresh = useCallback(() => setSnapshot(loadState()), []);
  return { state: snapshot, actions, refresh };
}
