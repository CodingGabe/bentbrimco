import { type Booking, serviceById } from "./types";

function stamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function bookingIcs(b: Booking) {
  const svc = serviceById(b.serviceId);
  const start = new Date(b.start);
  const end = new Date(start.getTime() + b.minutes * 60000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bent Brim Co//Claim Ticket//EN",
    "BEGIN:VEVENT",
    `UID:${b.code}@bentbrim.co`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${svc.name} at Bent Brim Co. (${b.code})`,
    `DESCRIPTION:${b.shape.preset} shape. Pickup code ${b.pickupCode}. Deposit $${b.deposit} credited to your total.`,
    "LOCATION:1512 S Congress Ave, Austin, TX",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(b: Booking) {
  const blob = new Blob([bookingIcs(b)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${b.code}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
