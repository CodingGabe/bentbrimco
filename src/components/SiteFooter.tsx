import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-3xl uppercase">Bent Brim Co.</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            1512 S Congress Ave
            <br />
            Austin, Texas
          </p>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          <p className="uppercase tracking-[0.2em] text-foreground">Hours</p>
          <p className="mt-1">Thu–Sat 10–6</p>
          <p>Tue–Wed by appointment</p>
          <p>Sun–Mon closed</p>
        </div>
        <div className="text-sm">
          <Link
            to="/about"
            className="underline decoration-brass underline-offset-4 hover:text-oxblood"
          >
            A fictional shop, a very real problem.
          </Link>
          <p className="mt-3">
            <Link
              to="/shop"
              className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-oxblood"
            >
              Shop side →
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
