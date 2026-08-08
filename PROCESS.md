# Process overview

This is a record of how **Exposure Lab** changed from a camera-settings
sandbox into a focused interactive lesson. It includes the decisions that
shaped the final experience, the important corrections raised during review,
and the final self-audit rather than describing only the first implementation.

## What I built

Exposure Lab teaches the photographic exposure triangle through a deliberate
sequence: a short introduction, three single-control lessons, one two-control
lesson, one full-triangle lesson, and four progressively unlocked challenges.
Each lesson uses a different AI-generated photograph. The visitor changes ISO,
aperture and shutter speed, compares the source and simulated result, watches
the exposure triangle respond, and receives a concise explanation of the visual
cost of the current settings.

The simulation is entirely client-side. A Canvas pixel pipeline applies
depth-of-field, exposure, sensor noise and subject-only motion blur to 720×480
photographs. A Web Worker keeps that processing away from the interface thread;
cached blur levels and a half-resolution drag preview keep controls responsive.
There is no backend and no runtime image-generation wait.

## The four decisions that mattered most

### 1. Teach one variable before asking for judgement

The first version exposed the full simulator too quickly. The stronger design
was to teach the prerequisite mental model before testing it: ISO alone,
aperture alone, shutter speed alone, ISO plus shutter, then all three controls.
That restructuring arrived in
[`c453896`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/c4538960509b6e5117aa9e1bdafbff6f17983ec8).
The lessons do not unlock merely because the visitor reached the page: the
required controls must be changed, exposure must be balanced, and the scene's
quality constraints must still be satisfied.

Review exposed another important distinction: finishing a lesson should unlock
the next lesson without ending exploration. Completed lessons therefore remain
interactive and revisitable, and the progress strip can jump among previously
completed nodes
([`514f7f3`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/514f7f3364b2e083558e61eb20fb95dcbe5d74fc)).
The same principle now applies to challenges: completion persists across a
refresh, unlocked scenes stay unlocked, and the last scene produces a true
"All challenges complete" state rather than claiming that another challenge
exists
([`713f5e3`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/713f5e3daa1323e032ee2c600083bf686683fdc3)).

### 2. Keep generation instant instead of pre-rendering every combination

Pre-generating every ISO/aperture/shutter combination would have created 2,240
images, a large download and an asset-maintenance problem. The final approach
keeps one photograph plus small masks per scene and renders settings locally.
The expensive blur pyramid is cached and processing runs through a Worker
([`e236f91`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/e236f91af444584fa52eee54937c22ca1df17191)).
During slider movement the pipeline renders a 360px preview, then settles to
the full 720px frame when interaction ends. Converting the source photography
from multi-hundred-kilobyte PNGs to WebP reduced the nine active photographs to
roughly 24–78 KB each
([`5dc7d6f`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/5dc7d6fd3e6b344895c09ec12fcacdf64116153e)).

This preserved the important interaction contract: changing a camera setting
feels immediate, while the final frame remains detailed enough for the visual
trade-off to be legible.

### 3. Treat the effects as explanations, not decoration

Several review comments identified places where an effect looked dramatic but
taught the wrong thing. Motion blur originally affected stationary scenery;
the pipeline was changed so directional blur is confined to the moving-subject
mask
([`58bfe03`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/58bfe035264ef9e127108c6c5794908b02caf91e)).
The cyclist lesson was also recalibrated so a moderate cyclist remains clean at
1/125s and only slower shutters create an obvious trail
([`7dbbf62`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/7dbbf62d03372eed158238eb7a2838955d5b245b)).

Depth of field needed the same restraint. Because the source photographs
already contain optical blur, applying the full theoretical blur again made
f/1.4 look artificial. The pipeline now adds only the incremental blur relative
to the photograph's effect baseline
([`ac6b5fe`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/ac6b5fe8d2a7529c221430ce22fd6dc0c1912c8d)),
and the portrait uses a refined subject mask and depth transition so the
background does not form a strange halo around the face and shoulders
([`314544f`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/314544f66810ff45ff9cde6e6164a9137f61abb0)).

The tutorial animations were revised by the same rule. They now show a concrete
before/after relationship and causal trade-off instead of ambient moving dots
([`9a8644b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/9a8644b9c80aac756c9fa711828ae2a6cabb071c)).

### 4. Test the shipped experience, then keep the tests honest as it changes

A deployment-shaped Playwright test caught a bug that the root-level local
server hid: root-absolute image paths worked locally but would 404 under a
GitHub Pages repository subpath. Serving `dist/` under a fake nested path made
the failure reproducible and led to relative asset URLs
([`bf64e3f`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/bf64e3f4edb8b27fb38ce4300be542dd206b09fd)).

Late in the project, the product had evolved but some e2e assertions still
expected the old scene defaults, all scenes unlocked, and the old keyboard tab
order. The final audit treated those failures as stale evidence rather than
weakening the product to satisfy them. The fixtures and expectations were
updated to the shipped learning flow, while desktop-only geometry checks were
kept out of the mobile browser project
([`e060e86`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/e060e8668e4aa4d40e1372a54406c14b0caadc78)).

The current result is 242 unit/component checks passing and 51 real-browser
checks passing across desktop and mobile, with one intentional skip for a
desktop-only layout assertion in the mobile project.

## Important feedback-led changes

The final product is intentionally narrower and clearer than several earlier
versions. The most consequential review-driven changes were:

- Added an explanation of what the site teaches before the first lesson, then
  enforced the one-dial → two-dial → three-dial → challenge progression.
- Gave every tutorial a different photograph and a causal animation, while
  removing live-setting labels from animations when they competed with the
  concept being explained
  ([`06e6476`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/06e64767dea31f2ac940151345c755ee59aacc66)).
- Added verified standard answers to every lesson and challenge, but kept them
  collapsed so visitors can attempt the problem first
  ([`bae1dc8`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/bae1dc8ec512a2288a16661b96ffb30cdecd6743)).
- Made completion impossible to miss with a top-layer celebration that fades
  after three seconds, while keeping the settings available for continued
  exploration
  ([`696a5f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/696a5f0cac5848676d8d7f0c9ac87c77f5d084aa)).
- Kept the header and completed-lesson shortcut visible during long pages
  ([`f1cdd16`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/f1cdd16454298c730b8e79c7400e100f41fdb72d)).
- Moved `What changed` and `What's happening` into the open space beneath the
  photograph rather than creating a detached full-width block
  ([`9340208`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/9340208c1132998f1e77bf1f0538b978a5755fcf)).
- Removed elements that did not support the core lesson, including Home,
  Reduce Motion as a visible control, redundant helper copy, and the experiment
  album. The album removal is recorded in
  [`7fd638a`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/7fd638a8d0880167da3f651fd87d879460e905aa).
- Replaced the initial editorial style with a restrained, dark product-page
  language, clearer hierarchy, persistent navigation and concise feedback
  ([`4c87d23`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/4c87d234b62efcba0c48a6e9c93451eeab117cc1)).

## Final self-audit

After the interface felt complete, I reviewed the full learning path, the
mobile layout, persistence, performance, accessibility and repository evidence
instead of looking only for visual defects. That audit found four remaining
issues:

1. **Mobile challenge navigation was too tall.** Four full-width cards consumed
   about 1,763px at a 600px viewport before the visitor reached the photograph.
   They now form a 294px horizontal, touch-scrollable rail with the next card
   deliberately visible and no document-level horizontal overflow
   ([`3d8a1e7`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/3d8a1e728541a57e61c029ddf2ac7732a0901edf)).
2. **Challenge completion disappeared after refresh.** Cleared scene IDs now
   persist, restore only valid scene IDs, and keep their successors unlocked;
   the fourth scene also has a permanent overall-completion summary
   ([`713f5e3`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/713f5e3daa1323e032ee2c600083bf686683fdc3)).
3. **The browser suite described an older product.** Its initial-value,
   unlock-state and keyboard-order assertions were updated and the full suite
   returned to zero failures
   ([`e060e86`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/e060e8668e4aa4d40e1372a54406c14b0caadc78)).
4. **The process description was stale.** It still described four procedural
   illustrations and omitted the guided lessons, real-time performance work,
   AI-generated photography and review-led corrections. This revision closes
   that documentation gap.

## Before shipping

`pnpm check` verifies types, the production build, linting and all 242
unit/component tests. `pnpm test:e2e` exercises the built site in desktop and
mobile browsers, including keyboard order, responsive overflow, the complete
guided path and GitHub Pages subpath loading. `pnpm check:evidence` verifies
that the cited commits resolve and that the required reflection files exist.

The checks are evidence, not a substitute for looking at the product. The final
manual pass still covers the first-visit introduction, every tutorial image and
animation, completion overlays, mobile horizontal navigation, challenge
persistence after refresh, and the final all-challenges-complete state.
