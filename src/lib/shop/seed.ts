import {
  DEFAULT_RULES,
  PRESETS,
  type Booking,
  type ServiceId,
  type ShopState,
  serviceById,
} from "./types";
import { DAY, startOfDay } from "./time";

let counter = 1000;
export function nextId(prefix = "id") {
  counter += 1;
  return `${prefix}-${counter}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export function makeTicketCode() {
  const n = Math.floor(Math.random() * 9000 + 1000);
  return `BB-${n}`;
}

export function makePickupCode() {
  const letters = "ACDEFHJKLMNPRTUVWXY";
  let s = "";
  for (let i = 0; i < 4; i++)
    s += letters[Math.floor(Math.random() * letters.length)];
  return s;
}

type SeedSpec = {
  name: string;
  phone: string;
  service: ServiceId;
  dayOffset: number;
  hour: number;
  status: Booking["status"];
  rush?: boolean;
  deposit?: number;
  firstTime?: boolean;
  replied?: boolean;
  material?: "felt" | "straw";
  preset?: number;
};

const PEOPLE: SeedSpec[] = [
  { name: "Marisol Ybarra", phone: "512-555-0142", service: "reshape", dayOffset: 0, hour: 10.5, status: "ready", replied: true },
  { name: "Dell Kirkpatrick", phone: "512-555-0119", service: "crease", dayOffset: 0, hour: 11.5, status: "drying", replied: true },
  { name: "June Ok", phone: "737-555-0188", service: "sizing", dayOffset: 0, hour: 13, status: "block", replied: true },
  { name: "Tavo Rendón", phone: "512-555-0171", service: "reshape", dayOffset: 0, hour: 15, status: "booked", firstTime: true, deposit: 0 },
  { name: "Bryce Lundquist", phone: "512-555-0106", service: "restore", dayOffset: 1, hour: 10, status: "booked", material: "straw" },
  { name: "Ana Sifuentes", phone: "512-555-0155", service: "crease", dayOffset: 1, hour: 12, status: "requested", rush: true },
  { name: "Cal Whitmore", phone: "737-555-0133", service: "reshape", dayOffset: 1, hour: 14.5, status: "booked", replied: true },
  { name: "Deandra Boyle", phone: "512-555-0197", service: "sizing", dayOffset: 2, hour: 10, status: "booked", firstTime: true, deposit: 0 },
  { name: "Hector Paz", phone: "512-555-0124", service: "crease", dayOffset: 2, hour: 11.5, status: "booked", replied: true },
  { name: "Sunny Reyes-Hale", phone: "512-555-0160", service: "reshape", dayOffset: 2, hour: 13.5, status: "requested", rush: true },
  { name: "Wade Ferris", phone: "737-555-0177", service: "restore", dayOffset: 3, hour: 10.5, status: "booked" },
  { name: "Lupita Márquez", phone: "512-555-0112", service: "sizing", dayOffset: 4, hour: 11, status: "booked", replied: true },
  { name: "Roland Teague", phone: "512-555-0148", service: "reshape", dayOffset: 4, hour: 15.5, status: "cancelled" },
  { name: "Nita Chalmers", phone: "512-555-0193", service: "crease", dayOffset: 5, hour: 12.5, status: "booked", material: "straw" },
  { name: "Emory Vance", phone: "512-555-0101", service: "reshape", dayOffset: -6, hour: 11, status: "ready", replied: true },
];

function seedBooking(spec: SeedSpec, base: Date): Booking {
  const svc = serviceById(spec.service);
  const d = startOfDay(new Date(base.getTime() + spec.dayOffset * DAY));
  d.setHours(Math.floor(spec.hour), (spec.hour % 1) * 60, 0, 0);
  const preset = PRESETS[spec.preset ?? Math.floor(Math.random() * PRESETS.length)];
  const rush = spec.rush ?? false;
  return {
    id: nextId("bk"),
    code: makeTicketCode(),
    pickupCode: makePickupCode(),
    name: spec.name,
    phone: spec.phone,
    serviceId: spec.service,
    shape: { preset: preset.name, curve: preset.curve, pinch: preset.pinch },
    material: spec.material ?? "felt",
    size: ["7", "7 1/4", "7 3/8", "Not sure"][Math.floor(Math.random() * 4)],
    deadline: rush
      ? new Date(d.getTime() + DAY).toISOString()
      : null,
    rush,
    mode: svc.dropOffOnly ? "dropoff" : spec.hour < 12 ? "bar" : "dropoff",
    start: d.toISOString(),
    minutes: svc.minutes,
    price: svc.price + (rush ? 25 : 0),
    deposit: spec.deposit ?? DEFAULT_RULES.deposit,
    status: spec.status,
    textReminders: true,
    firstTime: spec.firstTime ?? false,
    repliedToReminder: spec.replied ?? false,
    createdAt: new Date(d.getTime() - 5 * DAY).toISOString(),
    readyAt:
      spec.status === "ready"
        ? new Date(d.getTime() + 3 * 60 * 60 * 1000).toISOString()
        : undefined,
  };
}

export function seedState(base = new Date()): ShopState {
  const bookings = PEOPLE.map((p) => seedBooking(p, base));
  const now = base.toISOString();
  return {
    now,
    bookings,
    messages: bookings
      .filter((b) => b.status !== "requested")
      .map((b) => ({
        id: nextId("msg"),
        bookingId: b.id,
        to: b.phone,
        kind: "confirmation" as const,
        body: `Bent Brim Co. — you're on the bench. Ticket ${b.code}. See you then.`,
        sentAt: b.createdAt,
      })),
    waitlist: [
      {
        id: nextId("wl"),
        name: "Priya Nandakumar",
        phone: "512-555-0187",
        wants: "Any Saturday opening",
        addedAt: now,
      },
      {
        id: nextId("wl"),
        name: "Beto Aguilar",
        phone: "737-555-0164",
        wants: "Steam & Reshape, this week",
        addedAt: now,
      },
      {
        id: nextId("wl"),
        name: "Hazel Trammell",
        phone: "512-555-0128",
        wants: "Custom Crease before the rodeo",
        addedAt: now,
      },
    ],
    rules: { ...DEFAULT_RULES },
    automatedActions: 0,
  };
}
