# Process overview

A reading-guide to how the work came together. What I built, and the four
moments that mattered most — each one a citation into this repo's real commit
history, not a reconstruction.

## What I built

**Exposure Lab** is an interactive explainer of the
photographic exposure triangle. Pick one of four scenes (portrait, moving
subject, night street, landscape), then move ISO, aperture, and shutter speed
and watch a real Canvas pixel pipeline — exposure, sensor noise,
depth-of-field blur, motion blur, in that order — re-render the actual
consequence of that choice on the scene's image, alongside a live
exposure-triangle diagram and a plain-language explanation of the trade-off.
The whole thing is a static site: no backend, four procedurally generated
scene assets, everything computed client-side.

## The moments that mattered

1. **The e2e suite caught a bug the local build could never surface.**
   `vite.config.ts`'s `base: "./"` makes Vite-built asset URLs
   subpath-safe, but `src/domain/scenes.ts` loaded each scene's source
   image/mask/depth-map through a hand-written root-absolute string
   (`"/scenes/portrait/source.png"`), which resolves against the domain root
   regardless of page depth — invisible on `localhost:4173` (which *is* the
   root) but a guaranteed 404 for every scene once deployed under
   `username.github.io/<repo>/`. I wrote
   [`e2e/deployment-subpath.spec.ts`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/blob/main/e2e/deployment-subpath.spec.ts)
   specifically to rule this class of bug out — it serves the built `dist/`
   under an arbitrary nested path prefix (`/some-org/some-repo-name`), the
   shape of a real GitHub Pages URL, independent of the config's own
   `baseURL`. Its first run failed with three console 404s. Rather than
   patch the test to tolerate them, I fixed the actual bug: all four scenes'
   asset paths changed from `/scenes/...` to `./scenes/...` in
   [`bf64e3f`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/bf64e3f4edb8b27fb38ce4300be542dd206b09fd),
   and I put the reasoning into `CLAUDE.md` as a standing rule so the same
   mistake can't sneak back in with the next asset. Confirmed by re-running
   the suite to zero console errors and zero failed requests — the strongest
   kind of check here, since it isn't one I could have caught by looking at
   the dev server; it only exists because the harness simulates the actual
   deployment shape.

2. **Roving-tabindex tab order was a claim I had to verify, not assume.**
   Adding ARIA `radiogroup` semantics and roving `tabindex` to
   `SceneSelector` in
   [`1fb6bb7`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/1fb6bb72faaaf55dcfef4eb8a0ae79e95da93391)
   changed the keyboard tab order, and I first wrote the e2e assertion
   assuming Tab moved straight from the checked scene radio to the
   "Decrease ISO" button. It doesn't — the comparison slider's range-input
   handle sits between them in the DOM. Instead of guessing again, I drove a
   real headless Chromium session against the built site, pressed Tab eight
   times, and logged `document.activeElement` after each press, which gave
   me the actual order instead of my mental model of it. The corrected
   assertion — an extra Tab press plus a `toBeFocused()` check on the slider
   handle — is in
   [`e2e/accessibility-responsive.spec.ts`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/blob/main/e2e/accessibility-responsive.spec.ts),
   part of the suite committed in
   [`bf64e3f`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/bf64e3f4edb8b27fb38ce4300be542dd206b09fd).

3. **Vitest tried to run Playwright's own spec files, and the fix belongs in shared config, not a per-file workaround.**
   The moment `e2e/*.spec.ts` existed, `pnpm check` started failing with
   `Playwright Test did not expect test.describe() to be called here` —
   Vitest's default include glob also matches `*.spec.ts`, so it was
   importing Playwright's spec files and colliding with Playwright's own
   `test`/`test.describe` globals. Renaming every Playwright spec, or
   guarding each file individually, would only have deferred the same
   collision to the next spec I add. Instead the fix went into
   `vite.config.ts`'s `test.exclude`, which now explicitly excludes
   `e2e/**` — the boundary between the two test runners is structural now,
   not a convention I have to remember per file. Landed alongside the rest
   of the e2e suite in
   [`bf64e3f`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/bf64e3f4edb8b27fb38ce4300be542dd206b09fd),
   confirmed by both suites passing independently afterwards: `pnpm check`
   green at 31 files / 235 tests, `pnpm exec playwright test` green at 60/60
   across the desktop and mobile projects.

4. **The pixel pipeline is tested as pixel math, not as pictures.**
   Screenshot-diffing rendered scenes would have been fragile and would have
   let a subtly wrong blur radius or noise seed pass as long as it "looked
   about right." Instead every stage of `src/processing/pipeline.ts` is
   exercised in
   [`aeb9f2e`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/aeb9f2ecab54d8fd6516744c93131d6f69756ea5)
   against tiny synthetic `ImageData`-shaped fixtures with direct numeric
   assertions: exposure raises mean luminance, higher ISO raises noise
   variance, identical seeds reproduce identical noise, a wider aperture
   selects a blur level farther from the focus plane, output stays clamped
   to `[0,255]`. That decision is what let the later worker/main-thread
   dispatch layer
   ([`e236f91`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/e236f91af444584fa52eee54937c22ca1df17191))
   get added with confidence that it calls the exact same, already-verified
   functions rather than a re-implementation that only looks equivalent.

## Before you ship

`pnpm check:evidence` verifies your citations resolve to real commits, that the
current reflection entry is in `reflections/`, and that your `CLAUDE.md` is
there — before a marker ever opens the file. It checks that your map is
traceable, not that it is good: the marker judges whether your small,
deliberately chosen set of moments shows real judgement and reflection. A green
check is not a substitute for that curation.

Images are deliberately not checked, because whether one renders is visible the
moment you look. Open this file on GitHub and look at it before you ship.
