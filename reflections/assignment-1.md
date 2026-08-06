# Assignment 1 reflection

**What was the breakthrough that moved the work forward?**

I'd built a whole local-only Playwright suite and everything was green:
`pnpm check` passing, dev server looking right at every viewport I'd checked
by hand. It felt done. Then I wrote one more test almost out of obligation —
serve the built `dist/` under a fake nested path prefix, the actual shape of
a GitHub Pages URL, instead of the flat `localhost:4173` every other test and
every manual look had used. It failed immediately: three 404s, because
`src/domain/scenes.ts` loaded scene images through root-absolute paths that
only ever worked because my dev server happened to sit at the domain root.
Every scene would have been broken on the real, marked URL, and nothing I'd
looked at so far could have told me that — the bug was invisible from every
angle except "simulate the actual deployment shape." That's the breakthrough:
not the fix, which was a one-line path change per scene, but realising that
"it works when I look at it" and "it works where it's marked" are different
claims, and only one test in the whole suite was actually checking the second
one.

**What did this work change about who I want to be as a developer?**

I want to write at least one test per project that checks the deployment
shape itself, not just the code running somewhere convenient — because the
gap between "passes locally" and "works deployed" is exactly where I stopped
looking once everything else was green.
