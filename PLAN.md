# Plan: repair Desktop Agent and publish candidate beta.25

## Goal

Repair the verified Pi lifecycle, search persistence/networking/presentation, provenance, and
packaged-Electron failures; validate the resulting clean source; and publish the immutable
`@adrouter/agent@0.1.0-beta.25` candidate without moving `beta` or `latest`.

## Constraints

- Preserve Node.js 25.9.0, Pi 0.85.1, dependency pins, installation authentication, approvals,
  immutable task policy, existing `fetch_url` behavior, and the unrelated `AGENTS.md` edit.
- Develop in the current tree, but create and validate the release from an isolated clean worktree
  containing only reviewed implementation changes.
- Keep provider credentials in Electron Main; prohibit replay/fallback after paid output and retain
  production sandboxing.
- No Router deployment, stable release, `beta`/`latest` movement, production signing changes,
  secret changes, candidate finalization, or candidate-alias removal.
- Stop before publication if local release gates, required GitHub CI, immutable artifact
  verification, or npm/GitHub collision checks fail.

## Implementation

### A. Reproduce and repair lifecycle ownership

Status: `complete`

- [x] Convert the reproduced lifecycle and ownership failures into permanent regression tests.
- [x] Disable upstream retry/compaction and centralize idempotent Pi/runtime teardown.
- [x] Prevent post-termination dispatch while preserving serial tools and persistence.

### B. Serialize search state and repair transport

Status: `complete`

- [x] Serialize settings/cache mutations with generation-bound credentials and cache writes.
- [x] Enforce task/turn/request ownership, duplicate rejection, shared two-slot concurrency, and
  cancellation across DNS, queueing, response, extraction, and cache commit.
- [x] Correct pinned lookup behavior and independently bound encoded/decoded response bodies.

### C. Complete contracts and presentation

Status: `complete`

- [x] Bound cross-process result/citation/content/progress/error schemas and add web progress.
- [x] Render provider progress, partial failures, safe citations, excerpts, and cancellation while
  preserving older history and keeping full pages outside transcripts.
- [x] Strengthen all provider fixtures, errors, transient-key clearing, and no-replay behavior.

### D. Correct provenance and acceptance evidence

Status: `complete`

- [x] Reconcile the CLI ledger at `be7c53dc0b63fb90b70bd6cb7cad4d5713cc0d1a` and correct all
  upstream hashes, integrity evidence, and native-behavior decisions.
- [x] Diagnose the packaged Electron launch timeout without weakening production fuses/sandboxing.
- [x] Add upgrade/rollback and packaged UX acceptance coverage and refresh stable source parity.

### E. Candidate beta.25

Status: `in_progress`

- [x] Update all beta.25 version, changelog, About, manifest, documentation, and workflow inputs.
- [ ] Validate a clean isolated release worktree with every required local gate.
- [ ] Commit reviewed source on a `codex/` branch, open a PR, and require the full existing CI.
- [ ] Recheck npm/GitHub collision state, tag the exact validated merge commit, verify draft assets,
  dispatch protected candidate publication, and verify public registry/install results.

## Validation results

- Focused runtime, networking, search-store, search-service, renderer, and supervisor tests pass.
- Packaged macOS functional and security E2E pass using a build-only inspector harness; production
  packages retain inspector-disabled fuse verification and reject E2E hook text.
- Packaged acceptance covers Settings persistence, native search, readable retrieval, citations,
  history reopening, disable/key deletion, and task Stop. Synthetic beta.24 rollback preserves the
  managed app, installation material, task data, and workspace changes.
- The in-place `npm run check` reaches the public-boundary check after 219 unit and 13 integration
  tests pass, then rejects only the intentionally preserved unrelated `AGENTS.md` developer path.
  The required authoritative gate remains the isolated worktree that excludes that patch.
- Clean-worktree release gates, cross-platform CI, immutable artifacts, and publication remain.

## Reversibility

Search remains disabled by default and its encrypted settings/cache can be removed independently.
Published versions and tags are immutable; any failure after tagging or publication must fix
forward rather than replace beta.25.
