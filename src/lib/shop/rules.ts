import {
  type Booking,
  type ServiceId,
  type ShopRules,
  serviceById,
} from "./types";
import { DAY, HOUR, sameDay, startOfDay } from "./time";

export type Slot = {
  start: string;
  mode: "dropoff" | "bar";
  rush: boolean;
};

export type DayAvailability = {
  date: string; // ISO start of day
  open: boolean;
  slots: Slot[];
  reason?: string | undefined;
};

const CLOSED_DAYS = [0, 1]; // Sun, Mon
const APPOINTMENT_DAYS = [2, 3]; // Tue, Wed

export function dayLabelReason(dow: number) {
  if (dow === 0) return "Closed Sunday. Sol's off the kettle.";
  if (dow === 1) return "Closed Monday. Blocks are drying.";
  return "";
}

function overlaps(
  startA: number,
  minsA: number,
  startB: number,
  minsB: number,
  buffer: number,
) {
  const endA = startA + minsA * 60000 + buffer * 60000;
  const endB = startB + minsB * 60000 + buffer * 60000;
  return startA < endB && startB < endA;
}

export function activeBookings(bookings: Booking[]) {
  return bookings.filter(
    (b) => !["cancelled", "noshow", "picked"].includes(b.status),
  );
}

export function buildAvailability(opts: {
  now: string;
  serviceId: ServiceId;
  material: "felt" | "straw";
  deadline: string | null;
  rules: ShopRules;
  bookings: Booking[];
  days?: number;
}): DayAvailability[] {
  const { now, serviceId, material, deadline, rules, bookings } = opts;
  const service = serviceById(serviceId);
  const nowMs = new Date(now).getTime();
  const busy = activeBookings(bookings);
  const out: DayAvailability[] = [];
  const dayCount = opts.days ?? 14;

  const needsDrying =
    material === "felt" && ["reshape", "crease", "restore"].includes(serviceId);
  const dryMs = needsDrying ? rules.dryingHours * HOUR : 0;
  // deadline is end of that day (6pm pickup)
  const deadlineMs = deadline
    ? startOfDay(new Date(deadline)).getTime() + rules.closeHour * HOUR
    : null;

  for (let i = 0; i < dayCount; i++) {
    const dayStart = startOfDay(new Date(nowMs + i * DAY));
    const dow = dayStart.getDay();
    if (CLOSED_DAYS.includes(dow)) {
      out.push({
        date: dayStart.toISOString(),
        open: false,
        slots: [],
        reason: dayLabelReason(dow),
      });
      continue;
    }

    const rushToday = busy.filter(
      (b) => b.rush && sameDay(b.start, dayStart),
    ).length;
    const bookedToday = busy.filter((b) => sameDay(b.start, dayStart)).length;
    const saturdayFull = dow === 6 && bookedToday >= rules.saturdayCap;

    const slots: Slot[] = [];
    let missedDeadline = false;
    const closedForToday =
      nowMs > dayStart.getTime() + (rules.closeHour - 1) * HOUR &&
      nowMs < dayStart.getTime() + 24 * HOUR;

    for (
      let h = rules.openHour;
      h <= rules.closeHour - Math.ceil(service.minutes / 60);
      h += 0.5
    ) {
      const t = new Date(dayStart);
      t.setHours(Math.floor(h), (h % 1) * 60, 0, 0);
      const ms = t.getTime();
      if (ms < nowMs + HOUR) continue;
      if (ms + service.minutes * 60000 > dayStart.getTime() + rules.closeHour * HOUR)
        continue;

      const clash = busy.some((b) =>
        overlaps(
          ms,
          service.minutes,
          new Date(b.start).getTime(),
          b.minutes,
          rules.bufferMin,
        ),
      );
      if (clash) continue;
      if (saturdayFull) continue;

      const readyMs = ms + service.minutes * 60000 + dryMs;
      const rush = deadlineMs !== null && deadlineMs - readyMs < 2 * DAY;
      if (deadlineMs !== null && readyMs > deadlineMs) {
        missedDeadline = true;
        continue;
      }
      if (rush && rushToday >= rules.rushPerDay) continue;

      slots.push({
        start: t.toISOString(),
        mode: service.dropOffOnly ? "dropoff" : h < 12 ? "bar" : "dropoff",
        rush,
      });
    }

    let reason: string | undefined;
    if (slots.length === 0) {
      if (closedForToday) {
        reason = "Bench is closed for the day. Kettle's cooling.";
      } else if (missedDeadline && needsDrying) {
        reason = `Felt needs a full day to set after steaming, so this one can't make your date.`;
      } else if (missedDeadline) {
        reason = "Finishes after your deadline.";
      } else if (saturdayFull) {
        reason = "Saturday's capped so walk-ins still fit.";
      } else if (APPOINTMENT_DAYS.includes(dow)) {
        reason = "Tue and Wed are appointment-only and this one's spoken for.";
      } else {
        reason = "Bench is full. Try the next day.";
      }
    }

    out.push({
      date: dayStart.toISOString(),
      open: true,
      slots: slots.slice(0, 8),
      reason,
    });
  }

  return out;
}

export function quotePrice(serviceId: ServiceId, rush: boolean) {
  return serviceById(serviceId).price + (rush ? 25 : 0);
}

export function isAppointmentOnly(iso: string) {
  return APPOINTMENT_DAYS.includes(new Date(iso).getDay());
}
