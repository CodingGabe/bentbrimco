export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function fmtDay(iso: string) {
  const d = new Date(iso);
  return `${DAY_NAMES[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
}

export function fmtLongDay(iso: string) {
  const d = new Date(iso);
  const full = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return `${full[d.getDay()]}, ${d.getMonth() + 1}/${d.getDate()}`;
}

export function fmtTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`;
}

export function fmtStamp(iso: string) {
  return `${fmtDay(iso)} ${fmtTime(iso)}`;
}

export function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function sameDay(a: string | Date, b: string | Date) {
  const x = new Date(a);
  const y = new Date(b);
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
}

export function relative(fromIso: string, toIso: string) {
  const diff = new Date(toIso).getTime() - new Date(fromIso).getTime();
  const abs = Math.abs(diff);
  const unit =
    abs < HOUR
      ? `${Math.round(abs / 60000)} min`
      : abs < DAY
        ? `${Math.round(abs / HOUR)} hr`
        : `${Math.round(abs / DAY)} days`;
  return diff >= 0 ? `in ${unit}` : `${unit} ago`;
}
