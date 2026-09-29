import { useRef, useState } from "react";
import { HatProfile } from "./HatProfile";
import { PRESETS, type BrimShape } from "@/lib/shop/types";

function nearestPreset(curve: number, pinch: number) {
  let best = PRESETS[0];
  let d = Infinity;
  for (const p of PRESETS) {
    const dist = (p.curve - curve) ** 2 + (p.pinch - pinch) ** 2;
    if (dist < d) {
      d = dist;
      best = p;
    }
  }
  return d < 90 ? best.name : "Your own thing";
}

export function BrimPicker({
  value,
  onChange,
}: {
  value: BrimShape;
  onChange: (s: BrimShape) => void;
}) {
  const padRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const set = (curve: number, pinch: number, preset?: string) => {
    const c = Math.max(0, Math.min(100, Math.round(curve)));
    const p = Math.max(0, Math.min(100, Math.round(pinch)));
    onChange({ curve: c, pinch: p, preset: preset ?? nearestPreset(c, p) });
  };

  const fromEvent = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pinch = ((clientX - r.left) / r.width) * 100;
    const curve = ((r.bottom - clientY) / r.height) * 100;
    set(curve, pinch);
  };

  return (
    <div className="grid gap-5 md:grid-cols-[1.1fr_1fr]">
      <div
        ref={padRef}
        className="relative touch-none rounded-sm border border-border bg-secondary/70 p-4 shadow-[var(--shadow-lift)]"
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setDragging(true);
          fromEvent(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => dragging && fromEvent(e.clientX, e.clientY)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <HatProfile
          curve={value.curve}
          pinch={value.pinch}
          className="mx-auto h-44 w-full max-w-sm"
        />
        <button
          type="button"
          aria-label={`Shape handle. Left and right sets crown pinch (${value.pinch}), up and down sets brim curve (${value.curve}).`}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 10 : 4;
            if (e.key === "ArrowUp") set(value.curve + step, value.pinch);
            else if (e.key === "ArrowDown") set(value.curve - step, value.pinch);
            else if (e.key === "ArrowLeft") set(value.curve, value.pinch - step);
            else if (e.key === "ArrowRight") set(value.curve, value.pinch + step);
            else return;
            e.preventDefault();
          }}
          className="absolute h-11 w-11 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-paper bg-oxblood shadow-[var(--shadow-lift)] transition-transform hover:scale-105"
          style={{
            left: `calc(${value.pinch}% )`,
            bottom: `calc(${value.curve}% )`,
          }}
        >
          <span className="sr-only">Drag to shape</span>
          <span
            aria-hidden
            className="absolute inset-[9px] rounded-full border border-brass/70"
          />
        </button>
        <div className="mt-2 flex justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <span>open crown</span>
          <span>drag the brass</span>
          <span>tight pinch</span>
        </div>
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Or snap to a known crease
        </p>
        <div className="mt-3 grid gap-2">
          {PRESETS.map((p) => {
            const active = value.preset === p.name;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => set(p.curve, p.pinch, p.name)}
                aria-pressed={active}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-sm border px-3 py-2 text-left transition-colors ${
                  active
                    ? "border-oxblood bg-oxblood text-primary-foreground"
                    : "border-border bg-paper hover:border-oxblood/60"
                }`}
              >
                <span>
                  <span className="block font-display text-lg leading-tight">
                    {p.name}
                  </span>
                  <span
                    className={`text-xs ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}
                  >
                    {p.blurb}
                  </span>
                </span>
                <HatProfile
                  curve={p.curve}
                  pinch={p.pinch}
                  className="h-9 w-14 shrink-0 opacity-80"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
