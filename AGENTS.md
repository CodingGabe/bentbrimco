<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules

- All shop state (bookings, messages, waitlist, rules, simulated clock) lives in
  `src/lib/shop/store.ts` backed by localStorage — the demo must survive refresh
  without a backend.
- Availability is computed only by `src/lib/shop/rules.ts`; UI never invents
  slots, so drying time, hours, buffers, and caps stay enforced in one place.
- Time only advances through the Time Machine actions, never `Date.now()` in
  components, so the demo clock stays reproducible.
- The customer page uses hosted Tanker display type, Instrument Sans body type, and the supplied cowboy photograph via an asset pointer, preserving the retail-inspired hierarchy without changing booking logic.
- The six supplied colors are mapped to semantic tokens in `src/styles.css` with a 70% pale canvas, 20% dark/earth structure, and 10% copper accents so all views remain consistent.
