# Process overview

This is a reading guide to three decisions that turned Exposure Lab from an
image-processing prototype into a focused learning experience. Each moment
links the problem, the alternative I rejected, the verification I used, and
the commit record.

## What I built

**Exposure Lab** is a static interactive explainer of the photographic exposure
triangle. It teaches ISO, aperture and shutter speed one dial before two and
then all three, followed by four unlocked-in-sequence challenges. Visitors
compare an original and simulated photograph while the controls change
exposure, noise, depth of field and subject motion in real time. The central
idea is that there is no free setting: a useful photograph comes from choosing
the visual cost the subject can tolerate.

## The moments that mattered

### 1. Build one testable real-time pipeline instead of 2,240 images


The first risk was producing convincing effects whose camera maths could not be
trusted. I separated exposure, noise, depth of field and motion into pure
functions, then tested measurable consequences such as luminance, noise
variance, deterministic grain and clamped pixels. This was stronger than
accepting effects because they looked plausible. The foundation is visible in
[`ae80800...e236f91`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/compare/ae80800eeb0edf1e74dc5bb6f68e4b77ec609127...e236f91af444584fa52eee54937c22ca1df17191).

Pre-rendering every setting combination would make switching fast but create a
large download and maintenance problem. I kept live rendering, moved it into a
Worker, cached the blur pyramid, discarded stale requests and used a 360px drag
preview before settling to 720px. Converting the nine photographs from roughly
439–644 KB PNGs to 21–78 KB WebPs reduced the remaining transfer cost
([`5dc7d6f`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/5dc7d6fd3e6b344895c09ec12fcacdf64116153e)).
Pixel and frame-controller tests proved the maths and stale-frame behaviour;
repeated slider checks confirmed that interaction stayed responsive and the
final frame returned to full resolution.

### 2. Replace an open sandbox with a staged learning path


The simulator originally exposed all three controls before explaining them.
Adding more copy would still ask a beginner to reason about three variables at
once, so I changed the product structure instead: an introduction, three
single-dial lessons, a two-dial lesson, a full-triangle lesson, and only then
the challenges. Each lesson uses a different photograph and requires the
enabled controls to be tried, exposure to be balanced and the scene's quality
target to remain acceptable. The change from sequential challenges to a guided
course is captured in
[`119f576...c453896`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/compare/119f57615bceb84af9f612cd5a7162a0719f1c92...c4538960509b6e5117aa9e1bdafbff6f17983ec8).
The Playwright tutorial test verifies the complete path by operating the real
dials and confirming that later lessons and challenges stay unavailable until
their completion conditions are met.

### 3. Constrain motion blur to what actually moves


The first effect smeared stationary walls, trees and pavement, and exaggerated
a cyclist's movement at 1/125s. Reducing global blur until one screenshot looked
better would only hide the modelling error. Instead, directional blur now
samples only inside the moving-subject mask, never pulls background pixels
across its edge, and uses the scene's actual motion baseline. The cyclist stays
clean at 1/125s while slower values still demonstrate motion. The correction is
[`58bfe03...7dbbf62`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/compare/58bfe035264ef9e127108c6c5794908b02caf91e...7dbbf62d03372eed158238eb7a2838955d5b245b).
Pixel tests verify that a zero mask leaves background bytes unchanged, and the
browser comparison confirmed that the subject changes without shifting the
stationary scene.

## Before you ship

`pnpm check` currently passes 242 unit/component checks, while the built-site
Playwright suite passes 51 desktop/mobile checks with one intentional
desktop-only skip. `pnpm check:evidence` verifies the citations and required
process files. I also manually check the guided path, slider responsiveness,
motion masks and both marked viewports before accepting the rendered page.
