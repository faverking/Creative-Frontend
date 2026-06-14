# AGENTS.md

## Purpose

This file is the short operational guide for agents working in this repository.
It should stay stable, readable, and current. Put durable rules here; put full
project constraints in `docs/spec.md`; put one-off handoff notes in the thread,
not in this file.

## Read Order

- For every new coding session, read `docs/spec.md` first.
- If the task touches architecture, package boundaries, commands, validation,
  CI, release, or deployment behavior, also read `docs/overview.md` and
  `docs/workflows/README.md`.
- If the task touches `apps/portal-web` styles or layout, also inspect:
  - `apps/portal-web/src/styles/index.css`
  - `apps/portal-web/src/styles/tokens/*.css`
  - `apps/portal-web/src/styles/tokens-dark/*.css`
  - `apps/portal-web/src/styles/adaptive/*.css`
- For implementation, refactors, review fixes, cleanup, UI, API, package,
  config, or validation tasks, use `.codex/skills/monoapp-spec-coding/SKILL.md`.

## Repo Facts

- This is a pnpm workspace frontend monorepo.
- Active apps are `apps/portal-web` and `apps/admin-web`; `apps/ai-console` is a
  prepared app and is not part of the production frontend release bundle.
- Shared reusable capabilities belong in `packages/*`; app-specific pages, API
  adapters, permissions, routing, and bootstrapping stay in `apps/*`.
- Default local ports are `5174` for `portal-web` and `5173` for `admin-web`.
- Production frontend deployment is entered only through
  `.github/workflows/deploy-frontend.yml` and is triggered by `web-v*` tags.
  It publishes both `portal-web` and `admin-web`.

## Hard Rules

- Start by checking `git status --short --branch` and distinguish staged from
  unstaged changes.
- Do not revert existing user changes unless the user explicitly asks.
- Do not use destructive git commands unless the user explicitly asks for that
  exact operation.
- Fix defects at the owning boundary after identifying the root cause. Do not
  hide defects with call-site workarounds, duplicated guards, local patches, or
  extra fallbacks unless an external dependency forces a clearly scoped fallback.
- Do not keep compatibility leftovers unless the user explicitly asks for a
  migration window.
- During behavior migrations, remove unused imports, dead constants, fallback
  static data, redundant wrappers, old aliases, deprecated state branches, and
  obsolete CSS/token variables.
- If PowerShell output shows Chinese mojibake, verify with explicit UTF-8 file
  reads and with typecheck/build/test results before judging file encoding. Do
  not recode or overwrite files based only on terminal display.

## Auth And Requests

- Public content endpoints may be anonymous, but logged-in users still send
  token context when available.
- Do not mark a request as `skipAuth` just because guests can access the route.
  Use the optional-auth path for public requests that may include a token.
- If an optional-auth request was sent with a token and receives `401`, the
  request layer must allow token refresh and retry before treating the user as
  anonymous. This belongs in the shared request/runtime boundary, not in page
  components.
- `skipAuth` is reserved for genuinely unauthenticated requests and must strip
  explicit `Authorization` headers.

## Portal Web Rules

- Desktop portal styles use the 1920 design anchor. Source CSS is written in px
  semantics and converted by the portal build-time px-to-rem pipeline.
- Mobile portal styles are the independent `1100px` and below layer selected by
  `data-portal-viewport="mobile"`.
- Keep adaptive structure limited to `rem-root.css`, `shared.css`,
  `desktop.css`, and `adaptive/mobile/*`.
- Global portal token layers are fixed: `foundation`, `shared-components`,
  `home`, `public-detail`, `modules`, and `workspace`. Mirror dark tokens with
  the same semantic names and ownership.
- Promote tokens to global only for stable cross-page or cross-component
  semantics. Keep one-off sizes and component implementation details local.
- Home and public module surfaces should share the browse-stage baseline unless
  a real density, column, or media-ratio difference requires local variance.
- Public content requests must use the existing public request/result patterns;
  pages should render true loading, error, empty, and ready states rather than
  fallback static data.
- For public content return/navigation smoothness, prefer a data-layer
  TTL/stale-while-revalidate cache over route-level `KeepAlive` unless the user
  explicitly asks to preserve the whole component instance. Cache only validated
  successful responses; stale background refresh failures must leave existing
  ready data in place.
- Keep shared cache primitives small and mechanical, such as
  `readSnapshot`/`write`/`invalidate`. The owning page or composable should keep
  direct fetch calls, response validation, loading/error state, and retry
  behavior rather than wrapping API results in extra cache-specific result
  shapes.
- `PortalRequestBoundary` is the atomic state stage. The component that owns the
  real state transition should own the boundary directly; avoid extra wrapper
  shells around an already owned state boundary.
- Skeletons must match real layout structure. Generic shimmer utilities provide
  shimmer and overflow only; the concrete skeleton host owns positioning and
  dimensions.
- Comic chapter image enhancement is scoped to the book comic reader path. Do
  not generalize it to `PortalImage`, book details, galleries, or novel reader
  images unless the user asks.
- Book reader feature-local runtime, source adapters, catalog helpers, and
  reader-only components belong under `apps/portal-web/src/views/public/book-reader`.
- When the book reader catalog is open, chapter navigation must keep the active
  catalog item visible through the owning `el-scrollbar` API after `readerData`
  is assigned, the catalog DOM has settled, and the DOM active item matches the
  new chapter. Use a short-lived DOM observer for catalog readiness rather than
  fixed frame retries. Route-changing clicks only start navigation; they must
  not scroll the old catalog before loading begins.
- Book reader progress labels must distinguish reading progress from chapter
  position. Comic progress uses the current visible page and total page count,
  not dynamic scroll height, because lazy image layout changes can make height
  based progress move backward.

## Validation

- Match validation scope to the change.
- For `apps/portal-web` public content changes, default to:
  - `pnpm.cmd --filter portal-web typecheck`
  - `pnpm.cmd --filter portal-web build`
- Add `pnpm.cmd --filter portal-web test` and
  `pnpm.cmd --filter portal-web lint` when logic, tests, shared behavior, or
  CI-facing code changes.
- For release/deploy changes, align with `docs/workflows/README.md` and verify
  both frontend apps when the deployment surface can affect both.
- Run `git diff --check` before committing style, markdown, or test-only fixes.
- If a required validation cannot run, state the reason and the remaining risk.

## Release Notes

- Do not store an intended "latest release tag" in this file; it goes stale.
- Before creating a release tag, inspect local and remote `web-v*` tags and use
  the next unoccupied version requested by the user or implied by the release
  sequence.
- Prefer tagging commits already on `main`, then push the branch and tag to the
  user-specified remote.
