# Process overview

This guide traces three decisions that turned an image-processing prototype
into a focused learning experience.

## What I built

**Exposure Lab** teaches the photographic exposure triangle through an original
and simulated photograph. Learners control ISO, aperture and shutter speed one
dial before two and all three, then complete four challenges. Its central idea
is that every brighter image has a visual cost the photographer must choose.

## The moments that mattered

### 1. Build one testable real-time pipeline instead of 2,240 images

**What I asked.** I first proposed generating every camera-setting combination
so users would not wait five seconds after moving a dial. When this meant 2,240
images, I rejected it and asked for live rendering under one second, allowing a
lower-resolution preview during interaction.

**What the agent did.** The agent made exposure, noise, depth of field and
motion independently testable, then moved them into a Web Worker. It cached the
blur pyramid, discarded obsolete requests, rendered a 360px drag preview and
restored a 720px final frame
[`ae80800...e236f91`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/compare/ae80800eeb0edf1e74dc5bb6f68e4b77ec609127...e236f91af444584fa52eee54937c22ca1df17191).

**How I judged it.** Pixel tests checked luminance, noise, clamping and stale-
frame rejection. I converted nine 439–644 KB PNGs to 21–78 KB WebPs, then
repeatedly dragged the controls to confirm responsive previews and full-
resolution final frames
([`5dc7d6f`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/commit/5dc7d6fd3e6b344895c09ec12fcacdf64116153e)).

### 2. Replace an open sandbox with a staged learning path

**What I asked.** The original simulator exposed three controls without
preparation. I asked for one variable, then two, then all three, and only then
the challenges. More copy in the sandbox would not help beginners isolate
cause and effect.

**What the agent did.** The agent built an introduction, three single-dial
lessons, a two-dial lesson and a full-triangle lesson, each with a different
photograph and explicit completion conditions
([`119f576...c453896`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/compare/119f57615bceb84af9f612cd5a7162a0719f1c92...c4538960509b6e5117aa9e1bdafbff6f17983ec8)).

**How I checked it.** I completed both viewports. Playwright operates the real
dials and proves later lessons remain locked until their conditions are met.

### 3. Constrain motion blur to what actually moves

**What I told the agent.** Its first motion-blur implementation smeared the
whole photograph, including stationary walls, trees and pavement, and gave a
cyclist an implausible trail at 1/125s. I named both faults rather than only
saying the image looked bad.

**What the agent changed.** Instead of reducing global blur, it made
directional blur sample only inside the moving-subject mask, prevented
background pixels crossing its edge and calibrated each scene's motion
baseline. The cyclist stays clean at 1/125s while slower shutters still blur
([`58bfe03...7dbbf62`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-zdy-forever/compare/58bfe035264ef9e127108c6c5794908b02caf91e...7dbbf62d03372eed158238eb7a2838955d5b245b)).

**How I checked it.** Pixel tests prove a zero mask leaves background bytes
unchanged. Browser comparisons at 1/125s and slower settings confirmed that
only the moving subject changed.

## Before you ship

`pnpm check` currently passes 244 unit/component checks, while the built-site
Playwright suite passes 59 desktop/mobile checks with one intentional
desktop-only skip. `pnpm check:evidence` verifies the citations and required
process files. I also manually check the guided path, slider responsiveness,
motion masks and both marked viewports before accepting the rendered page.
