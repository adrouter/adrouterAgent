# Plan: Publish AdRouter Agent beta.20 to npm candidate

## Goal

Publish the current desktop implementation and completed chat-theme polish as immutable
0.1.0-beta.20 through adrouter/adrouterAgent to npm candidate only.

## Context

Candidate publication completed on 2026-09-10. The immutable release source remains
f5db057f13b6ccbad83bfd63a2ac7467edc16522. This later documentation receipt does not alter the tag
or release assets. Physical exact-artifact acceptance and public-channel finalization remain pending.

The user approved implementation on 2026-09-10, including the existing AGENTS.md and
.gitlab-ci.yml changes unchanged in the release-preparation commit. origin is the original
adrouter/adrouterAgent; github-backup is adrouter-co/adrouterAgent with no automatic pushes.
The previous completed plan is retained below as historical evidence; its earlier no-release
constraints describe that completed work, not this approved publication.

## Research Summary

- User approved narrow build-dependency fixes after the clean-install audit rejected new
  extract-zip, fast-uri, and xmldom advisories. Pin fast-uri 3.1.6 and xmldom 0.9.12; apply a
  hash-verified dev-only extract-zip backport with malicious archive regressions.
- npm authenticated Safari settings verified the exact trusted publisher and direct npm publish
  permission; local npm is 11.12.1 with Node 25.9.0.

- Local starting HEAD fea44c46f457246026080ee33cafde2049655a56 has the same tree as original main
  cab50c5806ed8ca5c0ae1bd2275b0f23ec2e9117 (prior squash merge).
- On 2026-09-10 npm candidate = beta.19; beta/latest = beta.16. Beta.20 was unused.
- Failed CI run 34031119517 belongs to Dependabot PR #30, not this release source; do not merge it.
- macos-release and npm-publish require HappyCool121 and need an exact beta.20 tag allowance.
- npm trusted publishing must match adrouter/adrouterAgent, promote-release.yml, npm-publish,
  and permit direct publishing. Configuration was verified in authenticated npm settings before dispatch.
- npm guidance: https://docs.npmjs.com/trusted-publishers/ (CLI >=11.5.1, Node >=22.14).

## Constraints

Use Node.js 25.9.0. Preserve runtime dependency pins, public APIs, authentication, state, and sponsor
behavior. Build/tag/publish only from a clean committed exact release source. Preserve both
existing governance/CI files unchanged. GitHub-built artifacts are the only publication inputs.

## Out of Scope

Public beta/latest promotion, physical acceptance sign-off, backup pushes, GitLab publishing,
landing/WebUI/Supabase changes, unrelated dependency updates, stable/signing-policy changes.

## Reversibility

Review one preparation commit. Versions, tags, and assets are immutable; fix forward after tagging.
Retry a partial npm publication only when registry integrity exactly matches the GitHub tarball
and candidate identifies the intended version. Never weaken environment policies.

---

## Step A: Prepare and validate the release source

### Status

`done`

### Tasks

- [x] Create codex/agent-candidate-beta20; include existing theme, governance, and GitLab CI work.
- [x] Align package/lockfile, manifest identity, About metadata, bundle 10020, promotion default,
      verification expectations, and release docs. Retain UNBUILT hash placeholders.
- [x] Regenerate source parity through its generator. Review and commit preparation together.
- [x] Run local gates and packaged dark/light visual checks at 960px and 1280px.
- [x] Push to origin and open PR #31; all validation/portability checks passed; the operator
      squash-merged the PR. GitHub reports no submitted review for this operator merge.
- [x] Merge normally, check out exact merged SHA, verify reviewed tree and successful CI.

### Commands

```bash
npm ci
npm audit --omit=dev --audit-level=moderate
npm run audit:build
npm run check
npm run verify:release-readiness
npm run test:e2e
git diff --check
git status --short --branch
```

### Acceptance Criteria

- [x] All local checks and GitHub portability/validation pass; final release checkout is clean.
- [x] Exact version/source agree; theme states inspected in both widths and modes.

### Validation Results

- Node 25.9.0 / npm 11.12.1; clean npm ci passed.
- Production audit passed with zero vulnerabilities. Build audit passed after approved build-only
  fixes; known dev-only brace-expansion advisories remain bounded by existing policy, and
  extract-zip advisories require exact patched bytes. This is not a zero-total-advisory claim.
- Full check passed: 163 unit tests, 13 integration tests, 56 launcher/policy tests, lint,
  typecheck, catalogs, source parity, docs, workflow and dependency-override checks.
- Release readiness passed; packaged E2E passed both tests.
- Nine new extract-zip cases cover external/duplicate/pre-existing/chained symlinks, valid files
  and internal symlinks, and absent/tampered patch rejection. Five native-symlink cases skip
  on Windows; malicious ZIP rejection and ordinary-file cases still run there.
- Packaged visual fixture covers Tier A/B, both themes and 960/1280 widths, active/completed
  thinking, grouped reads expanded/collapsed, code/links, and composer focus. Captures are
  ignored local artifacts in output/beta20-theme. Harness selectors and transition timing were
  corrected before final capture; no product changes resulted.
- AGENTS.md and .gitlab-ci.yml hashes match pre-task bytes. git diff --check passed.
- Earlier theme and remote-restoration results remain historical below.

---

## Step B: Verify protected publication prerequisites

### Status

`done`

### Tasks

- [x] Re-query versions/tags and record public-channel baselines; stop if beta.20 is consumed.
- [x] Verify npm trust metadata through authenticated settings without exposing credentials.
- [x] Verify npm CLI >=11.5.1; stop on missing/mismatched trust rather than substituting a token.
- [x] Add exact v0.1.0-beta.20 tag allowances to macos-release and npm-publish only.
- [x] Preserve reviewers and existing policy entries; HappyCool121 handles protected approvals.

### Acceptance Criteria

- [x] Publishing configuration verified; tag available; exact tag allowed without wildcard policy.

### Validation Results

Completed on 2026-09-10; see the release receipt below for immutable identities, workflows,
channel results, and verification evidence.

---

## Step C: Build and publish the immutable candidate

### Status

`done`

### Tasks

- [x] Tag and push only v0.1.0-beta.20 from the clean merged SHA to origin.
- [x] Require release-tag validation/native builds, protected aggregation, and verified draft assets.
- [x] Verify native ZIPs, SBOMs, tarball, checksums, schema-3 manifest, and attestations.
- [x] Dispatch promote-release.yml at the same tag with phase publish-candidate and channel beta.
- [x] Require GitHub-before-npm ordering and all four anonymous platform smoke jobs.

### Commands

```bash
gh workflow run promote-release.yml --repo adrouter/adrouterAgent --ref v0.1.0-beta.20 \
  -f tag=v0.1.0-beta.20 -f phase=publish-candidate -f channel=beta \
  -f operator_acceptance_override=false
```

### Acceptance Criteria

- [x] Exact GitHub-built tarball published to candidate; native assets verify and smoke jobs pass.

### Validation Results

Completed on 2026-09-10; see the release receipt below for immutable identities, workflows,
channel results, and verification evidence.

---

## Step D: Final verification and cleanup

### Status

`done`

### Tasks

- [x] Independently verify candidate = beta.20 and beta/latest equal recorded baselines.
- [x] Match registry tarball integrity and all public ZIP hashes to GitHub release evidence.
- [x] Record immutable source SHA, tag, workflow URLs, hashes, and acceptance limitations here.
- [x] Keep this post-publication receipt on a separate local documentation branch; no further
      remote source push or release rebuild is part of this receipt.
- [x] Review final diff and remove temporary test/debug files. Report partial completion accurately.

### Acceptance Criteria

- [x] Candidate publication and checks proven separately; no public-channel finalization.

### Validation Results

Completed on 2026-09-10; see the release receipt below for immutable identities, workflows,
channel results, and verification evidence.

## Release Receipt — 2026-09-10

- Published candidate: **0.1.0-beta.20**.
- npm beta/latest remain **0.1.0-beta.16**; candidate previously identified beta.19.
- Immutable tag: v0.1.0-beta.20 at **f5db057f13b6ccbad83bfd63a2ac7467edc16522**.
- Reviewed preparation: 7a7bece8b982f8c15b583a9a12aeeb05726789e4; its tree exactly matches the
  operator's squash merge. Original beta.19 branch/history remains intact.
- PR: https://github.com/adrouter/adrouterAgent/pull/31
- Merged-source CI: https://github.com/adrouter/adrouterAgent/actions/runs/34462132457 — passed.
- Native builds, protected aggregation, and draft release:
  https://github.com/adrouter/adrouterAgent/actions/runs/34462672216 — passed.
- GitHub-before-npm publication and anonymous macOS arm64/Intel, Ubuntu x64, Windows x64 smoke:
  https://github.com/adrouter/adrouterAgent/actions/runs/34464043185 — passed.
- Public prerelease: https://github.com/adrouter/adrouterAgent/releases/tag/v0.1.0-beta.20
- HappyCool121 supplied both protected environment approvals. Exact tag allowances were added
  without changing existing entries/reviewers. Creation of the new tag used the existing
  repository-admin exception; no existing tag, package version, or release asset was replaced.
- All ten draft files had valid GitHub attestations bound to release-tag.yml, the exact source
  digest, and refs/tags/v0.1.0-beta.20. The eight payload/SBOM file hashes and sizes match both
  artifact-manifest.json and SHA256SUMS; manifests/checksum-file attestations were also verified.
- Independent ZIP inspection passed safe-entry/symlink checks and native executable architecture;
  macOS bundle identity/version is com.adrouter.agent / 0.1.0 / 10020.
- Independent anonymous downloads of every public ZIP matched the verified hashes below.
- The anonymous npm tarball download exactly matched the GitHub-built tarball byte for byte;
  registry SHA-512 integrity also matched.

| Artifact | SHA-256 |
| --- | --- |
| AdRouter-Agent-0.1.0-beta.20-darwin-universal.zip | `ced773977a099aa057bc647789e0166910fbce755e0f9352aebd76d6b13c5622` |
| AdRouter-Agent-0.1.0-beta.20-linux-x64.zip | `d4dba3ae66143c9eddba1d6148e3581e298886c030967962209b7d49ddfcc64b` |
| AdRouter-Agent-0.1.0-beta.20-win32-x64.zip | `2dc04ad9431d383eda9f20d39d5bfffe4699890e5f14e66293d03711edaeb519` |
| AdRouter-Agent-0.1.0-beta.20-darwin-universal.cdx.json | `746372cf631bec1a46d98ee151cd2931e915871c603cdb7951e871a9b25e8410` |
| AdRouter-Agent-0.1.0-beta.20-linux-x64.cdx.json | `746372cf631bec1a46d98ee151cd2931e915871c603cdb7951e871a9b25e8410` |
| AdRouter-Agent-0.1.0-beta.20-win32-x64.cdx.json | `746372cf631bec1a46d98ee151cd2931e915871c603cdb7951e871a9b25e8410` |
| adrouter-agent-0.1.0-beta.20.tgz | `203f5a527af877b90861b769a0a6a1947b91dab9123f50a205bfc051d92a20fa` |
| AdRouter-Agent-0.1.0-beta.20-npm.cdx.json | `aac90d3e9dc1f9cc48a73d84279f8e42d667556ce0c273a25bf5084a9b294aba` |

Npm tarball integrity: `sha512-8iZ0AS/0PRUvhVg62pntbZCquk8Vb0951UXj4OGp3s3hd5fK1TI/QL/DDoDiglqXkEiH44FEIFt4Bs8mGq40fA==`.

This completes candidate publication only. No beta/latest movement, candidate removal,
physical acceptance attestation, signing/notarization change, backup push, landing/WebUI
change, Supabase mutation, or stable/automatic-update release occurred.

## Follow-up Work

Replace the local extract-zip backport once a reviewed upstream release fixes both advisories.
Physical primary-Mac/Windows exact-artifact acceptance and beta/latest finalization require
separate work and authorization. Signing/notarization policy remains unchanged.

## Decision Log

| Date | Decision | Rationale | Impact |
| --- | --- | --- | --- |
| 2026-09-10 | Fix new build-audit blockers narrowly | User approved scope extension | Two build-only pins and verified archive patch |
| 2026-09-10 | Publish current implementation as beta.20 | User approved candidate plan | New immutable version |
| 2026-09-10 | Include existing governance and GitLab CI unchanged | User prefers one preparation commit | Clean complete release input |
| 2026-09-10 | Use original GitHub; leave public channels unchanged | Approved candidate-only scope | No backup/other-platform deployment |

---

# Historical completed work

# Plan: Desktop chat theme polish and restore original release repository

## Goal

Refine AdRouter Agent chat colors in both themes, validate locally, and restore the original desktop release repository as the primary remote without publishing.

## Context

- User explicitly approved replacement of the prior parity/release plan on 2026-09-10.
- The workspace AGENTS.md already requires single-platform plans inside their target directory; no duplicate rule is needed.
- Preserve pre-existing desktop AGENTS.md changes and untracked .gitlab-ci.yml.
- Message-color changes apply only in dark mode. Light mode changes only thinking and grouped reads.
- Follow-up approved on 2026-09-10: restore adrouter/adrouterAgent as origin and retain adrouter-co/adrouterAgent as github-backup. Steps A–C retain the completed theme-work record; Step D records the remote restoration.

## Research Summary

- The white composer line comes from an inherited inset shadow; the dark canvas glow is a radial gradient.
- Thinking and grouped reads have separate selectors; Tier A/B classes identify all their placements.
- Read-only planning checks found npm latest/beta at 0.1.0-beta.16 and candidate at 0.1.0-beta.19.
- Legacy GitHub adrouter/adrouterAgent hosts beta.19 native/launcher artifacts; current origin adrouter-co/adrouterAgent has CI but returned no releases.
- Source inspection is sufficient for these CSS changes; no library changes or external framework research are needed.

## Constraints

- Theme work changes only src/renderer/styles.css and this scoped PLAN.md. The approved follow-up additionally changes desktop Git remote names, the original remote push URL, and current-branch upstream configuration through Git commands.
- Preserve APIs, IPC, authentication, state, layout, sponsor behavior, and unrelated local work.
- No dependencies, versions, publishing, deployment, pushes, tags, or channel mutations.
- Use Node.js 25.9.0 and read-only remote queries.

## Out of Scope

Unrelated redesign, light-mode message colors, Tier C styling, approvals/errors, repository-content migration, release preparation, and changes to landing-page/WebUI remotes or Supabase configuration.

## Reversibility

The isolated CSS diff can be reverted without changing contracts or user data. Preserve unrelated changes.

Remote restoration is reversible through Git remote renames and URL/upstream configuration; no commits, tags, or source history are changed. No automatic backup synchronization is configured.

---

## Step A: Replace the scoped plan

### Status

`done`

### Tasks

- [x] Replace the desktop PLAN.md with this task's plan.
- [x] Record dark-mode-only message-color changes and the existing workspace planning rule.

### Acceptance Criteria

- [x] Plan resides inside adrouter_release/adrouterAgent; no workspace-root plan or governance edits.

### Validation Results

- Inspected workspace AGENTS.md and repository status; existing governance work preserved.

---

## Step B: Apply the theme changes

### Status

`done`

### Relevant Files

- src/renderer/styles.css

### Tasks

- [x] Use a #1a1a1a main-chat canvas and neutral faint grid without the blue gradient.
- [x] Remove the dark composer inset shadow and retain visible keyboard focus.
- [x] Set dark thinking/grouped reads to #181818 with subdued borders and readable muted text.
- [x] Use #292929 assistant bubbles with light text and neutral code surfaces.
- [x] Use existing #3f65f5 blue for user prompts and white text/labels.
- [x] Use #1c2947 for Tier A/B across placements with readable links.
- [x] Soften only light-mode thinking/grouped reads using translucent neutral fills and faint borders; do not reduce whole-element opacity.

### Acceptance Criteria

- [x] Dark chat has no white composer highlight or blue canvas glow.
- [x] Assistant, user, and sponsor surfaces remain visually distinct and readable.
- [x] Thinking/read panels are darker in dark mode and subtler in light mode.
- [x] Tier C, approvals, errors, light-mode messages, and unrelated surfaces retain existing styling.

### Validation Results

Passed using the packaged local Electron app and deterministic fixtures. Screenshot review covers dark/light themes at 960px and 1280px, active/completed thinking, expanded/collapsed reads, composer focus, assistant prose/code/links, Tier A inline and Tier B card/composer placements, and switching back to light mode.

---

## Step C: Final verification and cleanup

### Status

`done`

### Tasks

- [x] Run local checks and deterministic Electron E2E using isolated fixture data.
- [x] Visually inspect both themes at 960px and 1280px, thinking/read disclosures, message prose/code/links, Tier A/B placements, focus, attached panels, scrolling, and return to light mode.
- [x] Re-query npm channels and GitHub releases/CI after local validation.
- [x] Review final diff and record results and limitations.

### Commands

```bash
node --version
npm run check
npm run test:e2e
git diff --check
```

### Acceptance Criteria

- [x] Local checks pass and visual states are inspected.
- [x] Remote release observations are reported separately from local work.
- [x] No remote mutation occurs.

### Validation Results

- Node.js: v25.9.0 explicitly pinned in PATH. The initial shell drifted to Node 24; the full gate was rerun under the required runtime.
- `npm run check`: passed — 40 unit-test files / 163 tests, 3 integration files / 13 tests, 47 launcher/policy tests; lint, typecheck, catalogs, source parity, public boundaries, docs, and workflows passed.
- `npm run test:e2e`: passed — 2 packaged Electron functional/security tests.
- Temporary visual QA harness: passed — 2 deterministic Tier A/B scenarios using isolated temporary projects and app profiles. Initial harness retries corrected selectors, alpha serialization, transition timing, and settlement fixture setup; no product changes were needed.
- Screenshot evidence: `output/theme-polish/` (ignored local artifacts). Captures were inspected after theme transitions completed.
- `git diff --check`: passed. Product diff is limited to src/renderer/styles.css; prior AGENTS.md and .gitlab-ci.yml work remains untouched.
- Read-only npm recheck on 2026-09-10: latest/beta = 0.1.0-beta.16; candidate = 0.1.0-beta.19.
- At theme-validation time, origin adrouter-co/adrouterAgent returned no releases; latest listed CI succeeded at e17cec1ca4b63ef0e1f17b2e000df7ce8fadbb27: https://github.com/adrouter-co/adrouterAgent/actions/runs/33834189829
- Original GitHub beta.19 remains a published prerelease with native ZIPs, launcher, checksums, and manifests: https://github.com/adrouter/adrouterAgent/releases/tag/v0.1.0-beta.19
- Published assets were inspected as metadata only, not downloaded or integrity-tested. No release, deployment, push, tag, or channel mutation occurred.
- Visual scope was theme polish. Existing dark task-title contrast and narrow-window header/long-approval layout issues are outside this change; no broader layout acceptance is claimed.

---

## Step D: Final verification and cleanup — original release repository

### Status

`done`

### Tasks

- [x] Rename desktop origin to github-backup, preserving its adrouter-co/adrouterAgent fetch/push URLs.
- [x] Rename github-legacy to origin and restore https://github.com/adrouter/adrouterAgent.git as its push URL.
- [x] Remove the codex/pi-candidate-beta19 upstream association with the backup. The branch does not exist in the original repository; establish its upstream only during a separately requested push.
- [x] Verify original and backup read access, remote URLs, and branch tracking.
- [x] Preserve HEAD, source changes, untracked files, other projects' remotes, and the completed theme-validation record.

### Acceptance Criteria

- [x] origin fetch/push targets adrouter/adrouterAgent; github-backup fetch/push targets adrouter-co/adrouterAgent.
- [x] Current branch has no upstream; main and other former legacy tracking associations follow the renamed origin.
- [x] No push, tag, workflow dispatch, publishing, deployment, database change, or workflow enablement occurs.

### Validation Results

- Git remote operations completed; git ls-remote succeeded for both repositories.
- Original remote HEAD: cab50c5806ed8ca5c0ae1bd2275b0f23ec2e9117. Backup remote HEAD: e17cec1ca4b63ef0e1f17b2e000df7ce8fadbb27. These are remote default-branch identities, not the local release commit.
- Local HEAD remains fea44c46f457246026080ee33cafde2049655a56 on codex/pi-candidate-beta19.
- Before/after assertions passed for the full source diff excluding this plan, working-tree status, all nonignored untracked file bytes, and landing-page/router remote configurations.
- Existing desktop AGENTS.md and untracked .gitlab-ci.yml remain untouched. The theme CSS remains unchanged.
- No application tests rerun: remote configuration and documentation changes do not alter application behavior.

### Permission and workflow findings (2026-09-10)

- GitHub collaborator API reports admin access for HappyCool121 and imari-adr on adrouter/adrouterAgent; both have repository push/workflow management permissions. No test push or workflow dispatch was performed.
- Original repository CI, release-tag, and promote-release workflows are active. HappyCool121 is the listed required reviewer for macos-release and npm-publish; imari-adr is not a listed reviewer. Preserve environment restrictions and immutable-tag rules.
- Latest listed original-repository ci run failed on September 6: https://github.com/adrouter/adrouterAgent/actions/runs/34031119517. Its failure was not diagnosed in this remote-configuration task. Permissions do not prove release readiness; npm trusted-publishing authorization remains unverified.
- Backup repository validation CI is active; its release-tag and promote-release workflows are disabled. Renaming a local remote does not change these settings or make an automatic backup.
- Landing-page origin remains adrouter-co/adrouter-web; router (WebUI/backend) origin remains adrouter-co/adrouter-dashboard. Validation CI is active; dashboard deployment/migration workflows are disabled. Landing's workflow validates without deploying.
- Today's landing deployment report records no Cloudflare Git connection; live Cloudflare settings were not rechecked here. The user reports new Supabase databases in a new organization; this task neither verifies nor changes database configuration.

## Follow-up Work

Candidate publication remains deferred. A separately requested release must resolve the original CI failure, verify npm trusted publishing, prepare a clean immutable release commit/version, build and verify native artifacts, and obtain the required protected-environment approval. Public beta/latest promotion remains a separate operation.

## Decision Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-09-10 | Replace the existing desktop plan | Explicit user selection |
| 2026-09-10 | Swap message colors only in dark mode | Confirmed theme scope |
| 2026-09-10 | Test locally; inspect remote state only | No publishing requested |
| 2026-09-10 | Restore original desktop origin and retain current repository as github-backup | User approved both-account access verification and desktop-only remote restoration |
| 2026-09-10 | Preserve landing/WebUI remotes, databases, and workflow settings | Follow-up scope is desktop remote configuration and documentation only |
