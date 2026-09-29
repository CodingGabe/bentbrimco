export type ServiceId =
  | "reshape"
  | "crease"
  | "sizing"
  | "restore";

export type Service = {
  id: ServiceId;
  plain: string;
  name: string;
  minutes: number;
  price: number;
  dropOffOnly: boolean;
  note: string;
};

export const SERVICES: Service[] = [
  {
    id: "reshape",
    plain: "It lost its shape",
    name: "Steam & Reshape",
    minutes: 30,
    price: 35,
    dropOffOnly: false,
    note: "Kettle, block, and a firm hand. Back to the crown it had.",
  },
  {
    id: "crease",
    plain: "I want it shaped my way",
    name: "Custom Crease",
    minutes: 45,
    price: 55,
    dropOffOnly: false,
    note: "You pick the crease. I put it in while you watch.",
  },
  {
    id: "sizing",
    plain: "It doesn't fit right",
    name: "Sizing & Fit",
    minutes: 40,
    price: 40,
    dropOffOnly: false,
    note: "Stretch, shrink, or a new sweatband. Ears stay flat.",
  },
  {
    id: "restore",
    plain: "It's been through it",
    name: "Clean & Restore",
    minutes: 90,
    price: 65,
    dropOffOnly: true,
    note: "Sweat, rain, a truck bed. Leave it with me a few days.",
  },
];

export const RUSH_FEE = 25;

export type BrimShape = {
  preset: string;
  curve: number; // 0 flat .. 100 heavy roll
  pinch: number; // 0 open .. 100 tight pinch
};

export const PRESETS: { name: string; curve: number; pinch: number; blurb: string }[] = [
  { name: "Cattleman", curve: 42, pinch: 58, blurb: "Three creases, working brim." },
  { name: "Gus", curve: 30, pinch: 74, blurb: "Sloped front, tall back." },
  { name: "Pinch Front", curve: 55, pinch: 82, blurb: "Tight teardrop, snapped down." },
  { name: "Open Road", curve: 18, pinch: 34, blurb: "Wide oval, flat brim." },
  { name: "Pencil Roll", curve: 86, pinch: 50, blurb: "Hard roll on both sides." },
];

export type BookingStatus =
  | "requested"
  | "booked"
  | "block"
  | "drying"
  | "ready"
  | "picked"
  | "cancelled"
  | "noshow";

export type Booking = {
  id: string;
  code: string;
  pickupCode: string;
  name: string;
  phone: string;
  serviceId: ServiceId;
  shape: BrimShape;
  material: "felt" | "straw";
  size: string;
  photoName?: string;
  deadline: string | null; // ISO date
  rush: boolean;
  mode: "dropoff" | "bar";
  start: string; // ISO datetime
  minutes: number;
  price: number;
  deposit: number;
  status: BookingStatus;
  textReminders: boolean;
  firstTime: boolean;
  repliedToReminder: boolean;
  createdAt: string;
  readyAt?: string;
  pickedAt?: string;
  notes?: string;
};

export type ShopMessage = {
  id: string;
  bookingId: string | null;
  to: string;
  kind:
    | "confirmation"
    | "heads-up-48"
    | "confirm-24"
    | "soon-2"
    | "ready"
    | "nudge-7"
    | "review"
    | "waitlist-offer"
    | "cancelled";
  body: string;
  sentAt: string;
};

export type WaitlistEntry = {
  id: string;
  name: string;
  phone: string;
  wants: string;
  addedAt: string;
  notifiedFor?: string;
  claimed?: boolean;
};

export type ShopRules = {
  bufferMin: number;
  dryingHours: number;
  rushPerDay: number;
  deposit: number;
  saturdayCap: number;
  openHour: number;
  closeHour: number;
};

export type ShopState = {
  now: string;
  bookings: Booking[];
  messages: ShopMessage[];
  waitlist: WaitlistEntry[];
  rules: ShopRules;
  automatedActions: number;
};

export const DEFAULT_RULES: ShopRules = {
  bufferMin: 15,
  dryingHours: 24,
  rushPerDay: 2,
  deposit: 15,
  saturdayCap: 6,
  openHour: 10,
  closeHour: 18,
};

export const serviceById = (id: ServiceId) =>
  SERVICES.find((s) => s.id === id) ?? SERVICES[0];
