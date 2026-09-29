export function Steam({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 -top-6 flex justify-center gap-3 ${className}`}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="steam-puff block h-6 w-1.5 rounded-full bg-foreground/25 blur-[2px]"
          style={{ animationDelay: `${i * 0.9}s` }}
        />
      ))}
    </span>
  );
}
