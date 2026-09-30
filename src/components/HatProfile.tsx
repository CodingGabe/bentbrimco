import type { Branding } from "@/lib/shop/types";

type Props = {
  curve: number; // 0..100
  pinch: number; // 0..100
  className?: string;
  branding?: Branding | null | undefined;
};

/** Front-facing silhouette based on the supplied cowboy-hat artwork. */
export function HatProfile({ curve, pinch, className, branding }: Props) {
  const tip = 111 - curve * 0.48;
  const basin = 115 + curve * 0.13;
  const crownTop = 29 - pinch * 0.12;
  const crease = crownTop + 9 + pinch * 0.23;
  const crown = `M 50 109 C 52 74 57 44 72 ${crownTop + 5} Q 81 ${crownTop - 7} 90 ${crownTop + 2} Q 100 ${crease} 110 ${crownTop + 2} Q 119 ${crownTop - 7} 128 ${crownTop + 5} C 143 44 148 74 150 109 Q 100 130 50 109 Z`;
  const brim = `M 50 105 Q 100 129 150 105 C 171 ${tip - 18} 188 ${tip - 18} 194 ${tip} C 200 ${tip + 27} 176 ${basin + 22} 147 ${basin + 12} Q 100 ${basin + 41} 53 ${basin + 12} C 24 ${basin + 22} 0 ${tip + 27} 6 ${tip} C 12 ${tip - 18} 29 ${tip - 18} 50 105 Z`;
  const band = `M 50 99 Q 100 118 150 99 L 150 109 Q 100 128 50 109 Z`;

  return (
    <svg
      viewBox="0 0 200 170"
      className={className}
      role="img"
      aria-label={`Cowboy hat, brim curl ${curve} of 100, crown pinch ${pinch} of 100${branding?.text ? `, ${branding.text} on ${branding.placement}` : ""}`}
    >
      <path d={brim} fill="var(--color-felt)" stroke="var(--color-brass)" strokeWidth="1.5" />
      <path d={crown} fill="var(--color-felt)" stroke="var(--color-brass)" strokeWidth="1.5" />
      <path d={`M 73 ${crownTop + 8} Q 84 ${crownTop - 4} 93 ${crease} Q 100 ${crease + 5} 107 ${crease} Q 116 ${crownTop - 4} 127 ${crownTop + 8}`} fill="none" stroke="var(--color-brass)" strokeWidth="1.4" opacity="0.8" />
      <path d={band} fill="var(--color-green)" stroke="var(--color-felt)" strokeWidth="1.2" />
      <path d={`M 11 ${tip + 3} Q 30 ${basin + 22} 53 ${basin + 12} M 147 ${basin + 12} Q 170 ${basin + 22} 189 ${tip + 3}`} fill="none" stroke="var(--color-green)" strokeWidth="1.8" />
      {branding?.text && branding.placement !== "underbrim" && <text x={branding.placement === "side" ? "136" : "100"} y={branding.placement === "side" ? "84" : "113"} textAnchor="middle" fontSize={branding.placement === "side" ? "6" : "8"} fontWeight="700" fill={branding.placement === "side" ? "var(--color-green-on-dark)" : "var(--color-felt)"}>{branding.text.slice(0, 12)}</text>}
      {branding?.text && branding.placement === "underbrim" && <text x="100" y={basin + 22} textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--color-green-on-dark)">{branding.text.slice(0, 12)}</text>}
    </svg>
  );
}
