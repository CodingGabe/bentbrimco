import { useRef, useState } from "react";
import { HatProfile } from "./HatProfile";
import { PRESETS, type BrimShape } from "@/lib/shop/types";

function nearestPreset(curve: number, pinch: number) {
  let best = PRESETS[0]!;
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

  const set = (pinch: number, preset?: string, curve = value.curve) => {
    const p = Math.max(0, Math.min(100, Math.round(pinch)));
    onChange({ curve, pinch: p, preset: preset ?? nearestPreset(curve, p) });
  };

  const fromEvent = (clientX: number) => {
    const el = padRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pinch = ((clientX - r.left) / r.width) * 100;
    set(pinch);
  };

  return (
    <div className="grid gap-5 md:grid-cols-[1.1fr_1fr]">
      <div
        ref={padRef}
        className="relative h-72 touch-none rounded-sm border border-border bg-secondary/70 p-4 pb-12 shadow-[var(--shadow-lift)]"
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setDragging(true);
          fromEvent(e.clientX);
        }}
        onPointerMove={(e) => dragging && fromEvent(e.clientX)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <HatProfile
          curve={value.curve}
          pinch={value.pinch}
          className="mx-auto h-52 w-full max-w-sm"
        />
        <button
          type="button"
          aria-label={`Crown pinch ${value.pinch} of 100. Use left and right arrow keys to adjust.`}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 10 : 4;
            if (e.key === "ArrowLeft") set(value.pinch - step);
            else if (e.key === "ArrowRight") set(value.pinch + step);
            else return;
            e.preventDefault();
          }}
          className="absolute bottom-10 h-11 w-11 -translate-x-1/2 rounded-full border-2 border-foreground bg-green shadow-[var(--shadow-lift)] transition-transform hover:scale-105"
          style={{
            left: `clamp(24px, ${value.pinch}%, calc(100% - 24px))`,
          }}
        >
          <span className="sr-only">Drag to shape</span>
          <span
            aria-hidden
            className="absolute inset-[9px] rounded-full border border-foreground/70"
          />
        </button>
        <div className="absolute inset-x-4 bottom-3 flex justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <span>open crown</span>
          <span>drag the green</span>
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
                 onClick={() => set(p.pinch, p.name, p.curve)}
                aria-pressed={active}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-sm border px-3 py-2 text-left transition-colors ${
                  active
                     ? "border-foreground bg-green text-foreground"
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
