type Props = {
  curve: number; // 0..100
  pinch: number; // 0..100
  className?: string;
};

/** Side profile of a western hat, drawn from curve + pinch values. */
export function HatProfile({ curve, pinch, className }: Props) {
  const lift = 6 + (curve / 100) * 46; // how far brim tips curl up
  const roll = (curve / 100) * 18;
  const pinchDepth = 6 + (pinch / 100) * 26;
  const crownTop = 54 - (pinch / 100) * 8;

  const brim = `M 18 ${132 - lift * 0.35}
    C 40 ${150 + roll * 0.2}, 160 ${150 + roll * 0.2}, 182 ${132 - lift * 0.35}
    C 168 ${140 - lift}, 32 ${140 - lift}, 18 ${132 - lift * 0.35} Z`;

  const crown = `M 52 134
    C 48 ${112 - pinchDepth * 0.2}, 50 ${crownTop + 14}, 62 ${crownTop + 4}
    C 74 ${crownTop - 4}, 82 ${crownTop + pinchDepth * 0.35}, 100 ${crownTop + pinchDepth * 0.2}
    C 118 ${crownTop}, 128 ${crownTop - 2}, 138 ${crownTop + 10}
    C 150 ${crownTop + 22}, 152 118, 148 134 Z`;

  return (
    <svg
      viewBox="0 0 200 160"
      className={className}
      role="img"
      aria-label={`Hat side profile, brim curve ${curve} of 100, crown pinch ${pinch} of 100`}
    >
      <path d={brim} fill="var(--color-felt)" />
      <path d={crown} fill="var(--color-felt)" />
      <path
        d={`M 54 ${128} C 80 ${138}, 120 ${138}, 146 ${128} L 146 118 C 120 128, 80 128, 54 118 Z`}
        fill="var(--color-oxblood)"
        opacity="0.95"
      />
      <path
        d={`M 100 ${crownTop + 4} C 92 ${crownTop + pinchDepth}, 108 ${crownTop + pinchDepth}, 100 ${crownTop + 4}`}
        stroke="var(--color-brass)"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}
