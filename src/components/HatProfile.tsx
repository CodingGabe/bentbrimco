type Props = {
  curve: number; // 0..100
  pinch: number; // 0..100
  className?: string;
  branding?: string | undefined;
};

/** Side profile with separate crown pinch and brim curl, sharing the same preview throughout booking. */
export function HatProfile({ curve, pinch, className, branding }: Props) {
  const tip = 133 - (curve / 100) * 43;
  const dip = 136 + (curve / 100) * 7;
  const crownTop = 56 - (pinch / 100) * 11;
  const crease = crownTop + 8 + (pinch / 100) * 20;

  const brim = `M 10 ${tip} Q 31 ${dip} 52 132 Q 100 ${dip + 3} 148 132 Q 169 ${dip} 190 ${tip} L 190 ${tip + 8} Q 168 ${dip + 10} 148 141 Q 100 ${dip + 12} 52 141 Q 32 ${dip + 10} 10 ${tip + 8} Z`;
  const crown = `M 51 133 C 49 107 48 73 60 ${crownTop + 8} Q 68 ${crownTop - 3} 80 ${crownTop + 4} Q 91 ${crease} 100 ${crease} Q 109 ${crease} 120 ${crownTop + 4} Q 132 ${crownTop - 3} 140 ${crownTop + 8} C 152 73 151 107 149 133 Z`;

  return (
    <svg
      viewBox="0 0 200 160"
      className={className}
      role="img"
      aria-label={`Hat side profile, brim curve ${curve} of 100, crown pinch ${pinch} of 100`}
    >
      <path d={brim} fill="var(--color-felt)" stroke="var(--color-brass)" strokeWidth="1.6" />
      <path d={crown} fill="var(--color-felt)" stroke="var(--color-brass)" strokeWidth="1.8" />
      <path d={`M 60 ${crownTop + 10} Q 72 ${crownTop + 1} 82 ${crownTop + 10} Q 100 ${crease + 7} 118 ${crownTop + 10} Q 130 ${crownTop + 1} 140 ${crownTop + 10}`} fill="none" stroke="var(--color-green)" strokeWidth="2.5" opacity="0.85" />
      <path
        d="M 51 117 Q 100 125 149 117 L 149 130 Q 100 138 51 130 Z"
        fill="var(--color-green)"
        stroke="var(--color-felt)"
        strokeWidth="1.5"
      />
      <path d={`M 14 ${tip + 4} Q 32 ${dip + 6} 52 136 M 148 136 Q 168 ${dip + 6} 186 ${tip + 4}`} fill="none" stroke="var(--color-green)" strokeWidth="2" opacity="0.85" />
      {branding && <text x="100" y="129" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--color-felt)">{branding.slice(0, 12)}</text>}
    </svg>
  );
}
