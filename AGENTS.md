# AGENTS.md

## Read Order

- For every new coding session, read `docs/spec.md` first.
- If the task touches architecture, package boundaries, commands, validation, or deployment behavior, also read `docs/overview.md` and `docs/workflows/README.md`.
- If the task touches `apps/portal-web` styles or layout, also check the style entry, token files, and adaptive files listed in `docs/spec.md`.

## Default Skill

- For implementation, refactors, review fixes, cleanup, UI, API, package, config, or validation tasks in this repo, use `.codex/skills/monoapp-spec-coding/SKILL.md`.
- `docs/spec.md` is the constraint source; do not duplicate or override the full spec here.

## Current Handoff

- The current worktree recently included a large-screen rem adaptation convergence for `apps/portal-web`: desktop uses 1920 as the only design anchor, build-time `postcss-pxtorem` converts px, and mobile remains independently overridden through `data-portal-viewport="mobile"`.
- The adaptive layer currently keeps only `rem-root.css`, `shared.css`, `desktop.css`, and `adaptive/mobile/*`; viewport semantics are `mobile` / default desktop.
- Public module list skeletons have been aligned with the real layout required by `docs/spec.md`: article, game, and book title / summary / footer skeleton heights are bound to the real text line heights instead of generic height estimates.
- Recent skeleton root causes:
  - `PortalTopicModuleView.vue`: `portal-topic-module-page__theme-tag-skeleton` needs its own `position: relative`; otherwise shimmer `::after { inset: 0 }` escapes the tag height bounds.
  - `PortalBookModuleView.vue`: the book cover skeleton reuses the real cover base class, so the real cover `::before` must be disabled and the `::after` book-spine dimensions reset to avoid polluting shimmer.
- Scan result: no second shimmer `::after` host missing a positioning context was found. Skeletons that reuse real base-class pseudo-elements must be checked case by case according to their real responsibility; do not blanket-remove them.
- The latest supplemental scan removed confirmed-unused generic surface tokens from portal foundation. Token-matrix items still not directly hit by source `var()` calls are Element Plus override variables.
- Latest successful verification: `pnpm.cmd --filter portal-web lint`, `typecheck`, `test`, and `build`. If continuing portal-web public content style changes, rerun checks according to impact scope before delivery.
- Release status for this handoff: `web-v1.1.3` is the intended portal-web release tag for the current responsive scaling work, and the push target is `Creative-Frontend/main` plus the matching tag.
- In the next session, first run `git status` and distinguish staged from unstaged changes. Do not revert existing work. If continuing skeleton investigation, start from three root-cause classes: real layout structure, pseudo-element positioning context, and real base-class pseudo-element pollution.

## Hard Rules

- Unless the user explicitly asks, do not use destructive git commands and do not revert user changes.
- If PowerShell output shows Chinese mojibake, verify with explicit UTF-8 reads and build/typecheck results before judging the encoding state.
- Keep responsibilities and boundaries clear: `apps/*` handles app-specific pages, API wiring, permissions, and bootstrapping; reusable cross-app capabilities go into `packages/*`.
- Add abstractions or layers only when they reduce real complexity, reduce meaningful duplication, or fit existing boundaries.
- Fix defects at the owning boundary after identifying the root cause; do not hide them with call-site workarounds, local patches, duplicated guards, or extra fallbacks unless the dependency is external and the fallback is explicitly scoped.
- Unless the user explicitly asks for a migration window, do not keep compatibility leftovers.
- During behavior migrations, clean unused imports, dead constants, fallback static data, redundant wrappers, old aliases, and deprecated state branches.
