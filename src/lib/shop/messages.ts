import { fmtLongDay, fmtTime } from "./time";
import { type Booking, serviceById } from "./types";

export const MESSAGE_LABEL: Record<string, string> = {
  confirmation: "Confirmation",
  "heads-up-48": "48h heads-up",
  "confirm-24": "24h confirm",
  "soon-2": "2h see-you-soon",
  ready: "Ready for pickup",
  "nudge-7": "7-day nudge",
  review: "Review request",
  "waitlist-offer": "Waitlist offer",
  cancelled: "Cancellation",
};

export function messageBody(kind: string, b: Booking) {
  const svc = serviceById(b.serviceId);
  const when = `${fmtLongDay(b.start)} at ${fmtTime(b.start)}`;
  switch (kind) {
    case "confirmation":
      return `Bent Brim Co. — ticket ${b.code}. ${svc.name}, ${when}. 1512 S Congress. Deposit $${b.deposit} is off your total.`;
    case "heads-up-48":
      return `Two days out: ${svc.name} ${when}. Nothing to do yet. — Sol`;
    case "confirm-24":
      return `Tomorrow, ${fmtTime(b.start)}. Reply Y to keep it, R to move it. Free until 24h out.`;
    case "soon-2":
      return `See you in a couple hours. Kettle's on. Ticket ${b.code}.`;
    case "ready":
      return `Your hat's done and it looks right. Pickup code ${b.pickupCode}. Thu-Sat 10-6.`;
    case "nudge-7":
      return `Your hat misses you. It's been on the shelf a week. Code ${b.pickupCode}.`;
    case "review":
      return `Hope it sits right. If you've got 20 seconds, leave a word about the shop.`;
    case "cancelled":
      return `Ticket ${b.code} is cancelled. Deposit's back on your card. Come by when you're ready.`;
    default:
      return "";
  }
}
