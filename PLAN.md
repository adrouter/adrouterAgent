# Candidate publication authorization — 12 September 2026

The operator explicitly authorized successor candidate publication with Kimi disabled in CLI/Desktop and excluded from OpenCode. Include GLM, both Qwen models, presence gating where applicable and preserved UI/output fixes. Exact-artifact live acceptance continues on candidates; beta/latest finalization remains separately authorized. This supersedes the earlier requirement to finish Kimi qualification before these candidate publications.

## Active combined candidate instruction — 12 September 2026

The operator-authorized combined plan supersedes conflicting sequencing and migration guidance below. `adrouter` is the active GitHub organization; `adrouter-co` is backup only. Explicit release targets are `adrouter/adrouterCLI`, `adrouter/adrouterAgent`, and `adrouter/adrouter-opencode`; local remote names do not establish authority. Never enable backup release workflows.

Successor candidates must preserve existing models, Desktop appearance/timeline/approvals/streaming, output settings, limits, truncation and authentication, and include GLM-5.3, Kimi K3 (WebUI/CLI/Desktop; excluded from OpenCode), both Qwen 3.8 models, and CLI/Desktop 60-second presence gating together. Presence includes first-response waiting, fresh task/prompt-bound acknowledgement, runtime execution boundaries, cancellation, approval timer suspension, RPC/IPC and noninteractive attention-required handling. Existing streams settle without replay. Kimi tools remain gated until real continuation qualification; reasoning remains memory-only. OpenCode excludes Kimi.

### Status
`in_progress`

- [ ] Reconcile dirty files and immutable baseline candidates before scoped commits.
- [ ] Complete combined implementation and deterministic presence acceptance.
- [ ] Run owning full checks and authenticated model/surface and packaged UI acceptance.
- [ ] Recheck spending/liabilities before bounded paid tests; preserve completed owner-cap and Kimi browser-vision receipts.
- [ ] Update landing lists truthfully; deploy any changed API before matching WebUI from clean exact commits with rollback/Pages preservation plan.
- [ ] Publish unused immutable successor candidates through active protected workflows, using the same tag as input and dispatch ref; verify integrity, native checksums, provenance and installation.
- [ ] Deliver exact macOS/Windows candidates for operator acceptance. Promotion requires separate authorization.

### Validation Results
Local presence implementation, Router/WebUI checks, CLI checks and focused runtime/provider/RPC tests, Desktop full checks and real 60-second packaged macOS acceptance, OpenCode checks, and landing catalog checks passed. Full live Kimi/cross-surface acceptance and immutable successor publication remain incomplete. No release channels or hosted deployments changed. See [implementation receipt](../../docs/combined-candidate-implementation-2026-09-12.md) for exact counts, baseline identities and blockers.

# Plan: Queued Agent models and presence prompt

## Goal

Preserve Desktop theme/timeline/approval/streaming fixes; add models and runtime blocking presence prompt after WebUI acceptance.

## Context

Approved 2026-09-11. First milestone is the live owner-only WebUI. This scope is queued until WebUI acceptance.
Baseline label: **before new models, still there. adrouterAgent UI fixes + new output limit**.
Recovery commits and original dirty-state metadata are in `../../docs/baseline-before-new-models-20260911.json`. Published candidates and deployed artifacts are distinct from these source checkpoints.

## Research Summary

Official references: https://docs.z.ai/llms.txt, https://platform.kimi.ai/docs/llms.txt, https://www.alibabacloud.com/help/en/model-studio/models. Verify exact regional prices/limits and account access before enabling selected IDs: glm-5.3, kimi-k3, qwen3.8-max, qwen3.8-flash. No replacement IDs. Context7 is not needed for the existing adapter approach.

## Constraints

- Add to existing behavior; preserve all unfinished work below, Desktop UI fixes and output limits.
- Provider keys remain backend-only: ZAI_API_KEY, MOONSHOT_API_KEY, QWEN_API_KEY.
- Keep catalog schema 2 and existing thinking vocabulary compatible with current clients.
- Kimi continuation is memory-only; hold Kimi if compliant continuation is infeasible.
- Preserve owner-only access, account spending limits and other existing account caps. New accounts default to 16384; owner at least 16384.
- Live acceptance costs at most US$1 aggregate, including earlier tests, retries and unresolved liabilities. Permanently raise only owner daily/monthly caps to at least US$5, preserving higher values; this does not raise the test ceiling.
- Sponsor metadata never enters model/tool context. No automatic replay after partial output.
- No new dependencies or unrelated redesign. All deploy inputs must be clean and committed.

## Out of Scope

Public-channel promotion, replacement of existing candidate features, unrelated UI redesign and destructive database resets.

## Reversibility

Existing tags remain immutable. Checkpoints preserve source without changing working trees. Deploy API before Pages from exact commits; record immutable rollback artifacts. Database/account rollback requires deliberate review.

---

## Step A: Preserve and prepare

### Status

`done`

### Tasks

- [x] Preserve original source in recovery checkpoint commits.
- [x] Retain existing plan contents without replacement.

### Acceptance Criteria

- [x] Existing tags and working source are preserved.

### Validation Results

- Repository status and checkpoint creation: passed; no working-tree reset.

---

## Step B: Implement scoped additions

### Status

`todo`

### Tasks

- [ ] Preserve Desktop theme/timeline/approval/streaming fixes; add models and runtime blocking presence prompt after WebUI acceptance.
- [ ] Record official provider capabilities, admission ceilings and pricing evidence before enablement.
- [ ] Keep live deployment held until keys and preflight evidence are available.

### Relevant Files

- Source, tests, configuration and release inputs owned by `adrouter_release/adrouterAgent`.

### Expected Changes

- Modify only scoped source, tests and documented configuration; regenerate catalog outputs using owning generators.

### Do Not Modify

- Existing immutable tags, private credentials, unrelated working changes, generated artifacts by hand.

### Acceptance Criteria

- [ ] Scoped behavior works and existing behavior remains covered.
- [ ] For CLI/Agent: after 60 seconds thinking/reading, fresh Enter clears the gate; current stream continues but interactions and new tool/model/delegation rounds wait. Repeat each minute. Headless CLI reports attention-required. Enter never grants another approval.
- [ ] Provider vision is distinguished from client attachment support.

### Validation Results

- Implementation and hosted acceptance: not run.

---

## Step C: Final verification and cleanup

### Status

`todo`

### Tasks

- [ ] Run relevant checks and review final diff for unintended changes.
- [ ] Remove temporary debugging changes and update developer configuration documentation.
- [ ] Record test results, remaining blockers and exact source/deployment receipts.

### Commands

```sh
npm run check
```

### Acceptance Criteria

- [ ] Relevant tests pass; unavailable database/native/live checks are explicitly recorded.
- [ ] API/WebUI release uses clean exact commits and validated artifacts, with no unintended Pages auto-deploy.

### Validation Results

- Checks: not run for these additions.

## Follow-up Work

Client candidates and landing updates follow successful WebUI acceptance. Physical Desktop acceptance remains separate from automated checks.

## Decision Log

| Date | Decision | Rationale | Impact |
| --- | --- | --- | --- |
| 2026-09-11 | WebUI first; preserve existing plans and candidates | Explicit user instruction | Later surfaces remain queued |
| 2026-09-11 | Backend-only direct international PAYG keys | Approved provider choice | No browser secrets |

---

## Preserved earlier plan and unfinished work

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


---

## Streaming-fix candidate beta.21 — verified 2026-09-10

### Status
`complete` (candidate only; public-channel finalization pending)

- Published `@adrouter/agent@0.1.0-beta.21` to `candidate`; `beta` and `latest` remain `0.1.0-beta.16`.
- Immutable tag `v0.1.0-beta.21`, source `c4a0e9a04012e8d140ef445b7fb08bc1eaa76369`, original repository `adrouter/adrouterAgent`. PR #33 merged; reviewed preparation and merged trees matched exactly.
- Release input: clean isolated checkout `../release-streaming-20260910/adrouterAgent`, detached at the source above. This canonical working checkout retains the operator's prior local work; it was not the release input. No backup synchronization.
- Local Node 25.9.0 installation, production audit, existing build-audit policy, check (172 unit, 13 integration, 56 launcher policy), release readiness and two packaged E2E tests passed. Build audit passed its verified-backport policy; this is not a zero-development-advisory claim.
- Merged CI: https://github.com/adrouter/adrouterAgent/actions/runs/34483570794
- Native staging: https://github.com/adrouter/adrouterAgent/actions/runs/34488074265
- Candidate publication and all four anonymous install/doctor/integrity/launch checks: https://github.com/adrouter/adrouterAgent/actions/runs/34494648393
- Ten-file release inventory verified: three ZIPs, native and launcher SBOMs, launcher tarball, schema-3 manifest and checksums. Every downloaded file matches the cryptographically verified release-workflow attestation at the exact source SHA. All three public ZIP URLs were independently streamed anonymously and matched expected size/SHA256. npm tarball bytes match the GitHub-built launcher.
- npm integrity: `sha512-5GaYVEmebxxOqGLDzxuxPMl4uuE010/6vaPTYWoKPwAmlvQJkV8OKtTWeTe4v4RSmHnQ5RCyGN0VfalXMdUGlg==`
- macOS universal ZIP SHA256: `867fde2db323462dea88d655640136a2c3e5e772b25e54aaa2c907d0289e6b99`
- Linux x64 ZIP SHA256: `cf21d7de664f491f2ffe0c677ae7ff7ec15a826fcfd88a16d76e0b11a11614f5`
- Windows x64 ZIP SHA256: `97804169aca6114626ab458c857601d3e687a59dc51368960abe1fb16c6742d6`
- Changes: incomplete-stream detection, bounded cancellation cleanup, visible failed-turn state and composer recovery. The historical one-minute stall remains unverified; no new incident reproduction or output-limit increase.

### Remaining acceptance
Primary Mac and physical Windows 11 x64 exact-artifact acceptance, validated `authentication-acceptance.json`, and separately authorized beta/latest finalization remain pending. macOS is ad-hoc signed; Linux/Windows are unsigned portable builds. Candidate checks do not establish notarization or physical acceptance. Previous theme-validation and repository-restoration records above remain historical evidence.


---

# Plan: Effective output defaults — 11 September 2026

## Goal
Raise applicable effective defaults to 16,384 while preserving account caps and model maxima.

## Context
Verify normal runtime omits the request output limit and recovers after incomplete streams; preserve existing streaming edits.
Source work is authorized before existing candidate promotion; published versions remain immutable.

## Research Summary
Current source distinguishes request defaults from model maxima. Supabase changelog and migration documentation checked 2026-09-11: no applicable breaking change for ALTER COLUMN SET DEFAULT.

## Constraints
Preserve unrelated edits, existing account rows, explicit request limits, pricing, and provider maxima. No new dependencies or live mutations.

## Out of Scope
Candidate promotion, new provider support, live account migration, hosted deployment and successor publication.

## Reversibility
Keep edits scoped. New-account migration changes only the column default; reverting it requires a new migration, not historical edits.

## Step A: Implement and cover the default behavior

### Status
`done`

### Tasks
- [x] Implement or verify this repository's default path.
- [x] Add focused boundary and recovery coverage; preserve existing tests.
- [x] Update current documentation and generated metadata through existing tooling.

### Acceptance Criteria
- [x] Omitted limits fit permitted caps; explicit limits retain validation.
- [x] Model maxima and existing account policies remain unchanged.

### Validation Results
Local checks passed; commands, counts and unavailable database checks are recorded in [implementation and rollout evidence](../../router/docs/output-defaults-16384.md). No hosted inference or deployment was performed.

## Step B: Final verification and cleanup

### Status
`done`

### Tasks
- [x] Run owning-project checks and review the final diff.
- [x] Record source SHAs, test results, limitations and deployment/account-policy follow-up.

### Acceptance Criteria
- [x] Checks pass or unavailable checks have documented blockers.
- [x] Local changes are clearly distinguished from published/deployed state.

### Validation Results
Local checks passed; commands, counts and unavailable database checks are recorded in [implementation and rollout evidence](../../router/docs/output-defaults-16384.md). No hosted inference or deployment was performed.

### Findings / Notes

Source changes are complete and locally checked. Database pgTAP/lint/advisor/local-service execution remains unavailable because Docker is stopped and no PostgreSQL server is installed. The pre-existing discarded-provider-finish-reason gap prevents claiming token-truncation acceptance. OpenCode sends an explicit limit, so existing lower-cap accounts need a smaller call/provider setting or separately approved policy updates. These are rollout limitations, not evidence that the new defaults shipped.

## Follow-up Work
Separate approval for live migration/deployment and successor publication. Existing-account update must use explicit selection, aggregate impact review, audit and verification; it is not part of the default-only migration.

## Decision Log

| Date | Decision | Rationale | Impact |
| --- | --- | --- | --- |
| 2026-09-11 | 16,384 supersedes 8,192; fit omitted values to account/model/platform caps | Operator-approved plan | Existing lower caps continue to work without account updates |
| 2026-09-11 | Source preparation precedes candidate promotions | Operator instruction | No changes to published versions or channels |


# Plan: Truncation safety and Fly rollout — 11 September 2026

## Goal and constraints
Preserve completion reasons, block incomplete tools, retain settled usage and partial text, then deploy the exact clean Router commit to existing Fly staging. No Pages push/deploy, hosted migration/account update, client publication, or automatic paid replay. Preserve unrelated changes.

## Step A: Completion handling
### Status
`done`
- [x] Implement provider completion validation and backward-compatible terminal errors.
- [x] Verify local client recovery and usage retention.

## Step B: Final verification and cleanup
### Status
`review`
- [ ] Run owning-project checks and synthetic truncation/accounting tests.
- [ ] Review diff, update evidence, and record remaining gaps.
- [ ] Router only: clean exact-SHA deployment, preserve Pages, verify health and reconcile budget before canaries.

## Decision Log
| Date | Decision | Rationale | Impact |
| --- | --- | --- | --- |
| 2026-09-11 | Fix truncation before existing Fly API rollout | Explicit operator request | Database migration and client publication remain pending |

Validation and deployment preflight: [Router evidence](../../router/docs/output-defaults-16384.md). Local suites passed. Hosted deployment is pending local database bootstrap/reset permission and remaining acceptance gates; no live requests made.


## Four-model completion — 12 September 2026

### Status

`in_progress`

The current instruction supersedes earlier five-model scope and temporary-budget holds. Preserve **before new models, still there. adrouterAgent UI fixes + new output limit** and all unfinished work above. Selected additions are GLM-5.3, Kimi K3, Qwen 3.8 Max and Qwen 3.8 Flash.

- [ ] Reconcile candidate source with preserved pending changes, including Desktop appearance/timeline/approvals and output limits.
- [ ] Audit owner-only daily/monthly caps at least US$5, preserving higher limits and all other accounts/platform limits. Enforce US$1 aggregate test exposure including earlier tests and unresolved liabilities.
- [ ] Reject GLM Flash before reservation; retain historical accounting/database compatibility. Include recovery liabilities in spending summaries without concurrency occupancy.
- [ ] Complete four-model streaming/thinking/tools/accounting/cancellation/forced-truncation acceptance. Qualify Kimi image upload/follow-up/reload before enabling vision.
- [ ] Regenerate canonical client contracts; implement memory-only Kimi tool continuation, reset/exclusion coverage, and authenticated transport acceptance on every client.
- [ ] Verify CLI/Desktop 60-second presence gating including first-response wait, fresh Enter, repeated timing, continued stream reception, blocked execution and separate permission approval; headless attention-required status.
- [ ] After functional acceptance update desktop/mobile landing lists; run owning checks, contract compatibility and packaged Desktop acceptance.
- [ ] Prepare rollback artifacts; deploy clean exact-commit API before WebUI; publish immutable successor candidates only after checks and authenticated acceptance. Keep beta/latest separate.

### Validation Results

Implementation underway. No new hosted inference, account mutation, deployment or publication has occurred in this continuation. Pending checks are not passes.

### Local implementation receipt — four-model continuation

Partial implementation only; rollout remains `in_progress`. Router now omits GLM Flash from runnable catalogs and WebUI fallback. Historical types, pricing and database compatibility remain intact. Regression coverage rejects GLM Flash before a database connection/reservation. Account summaries include recovery liabilities in held spending, with concurrency unchanged; WebUI labels these outstanding reservations.

Router, CLI and Desktop catalog digest: `sha256:6c48a4b0142dbc8a19813799c146a6bb5f828ebc3240471ce94313091b805bf3`. CLI/Desktop generators retain all twelve catalog descriptors; the nine tool-capable models are selectable, while Kimi tools remain gated. CLI documentation now distinguishes the 16,384 default from maximum limits.

Validation: Router backend typecheck/full test suite/build passed; WebUI typecheck, 88 tests, 10 hosted-build checks and build passed (three wallet tests rerun after the label change). CLI full `npm run check` passed. Desktop typecheck, 174 unit tests, 13 integration tests, catalog and public checks passed; source parity regenerated through its script. Earlier stale expectations, formatting and plan-path failures were corrected. The aggregate Desktop npm check invoked Node 24 through npm's script PATH, so it is not a valid pinned-Node full-check receipt; direct unit/integration tests were rerun with the shell's Node 25.9.0. Packaged/native acceptance and launcher verification remain pending.

Candidate tags were fetched read-only: CLI beta.24 and OpenCode beta.11 exist on github-legacy, not current origin; Desktop beta.21 exists on origin. Desktop timeline/provider/bounded-response source matches beta.21; CLI retains its additional incomplete-tool rejection. Release metadata reconciliation and complete combined-baseline approval/appearance/output acceptance remain pending. No tags were changed.

No new paid inference (US$0 additional), account mutation, deployment, release commit, publication or promotion occurred. Prior spending/liabilities were not re-queried. Owner permanent US$5 caps, Kimi vision/tool continuation and persistence exclusions, presence prompts, OpenCode catalog/runtime extension, authenticated four-model acceptance, landing updates, packaged Desktop acceptance and immutable successor releases remain unfinished. No authentication/provider checks were attempted in this continuation and none are marked passed.


### Continued implementation and hosted owner receipt — 12 September 2026

Owner permanent daily/monthly limits are verified at 5,000,000 microusd with audit action `raise_owner_permanent_allowance_20260912`; other two accounts remain 500,000 daily/5,000,000 monthly, output 4,096/concurrency 1. Owner output 16,384/concurrency 1 preserved. Applied from clean Router commit `3f8614d`; no API/Pages deployment. The SQL preserves higher limits and changes only the unique owner.

Live Kimi vision provider qualification passed with finish `stop`, 132 input/46 output tokens and 1,086 microusd settled cost. Source is committed at `295942e` after adding a conservative aggregate ceiling and stdin argument handling. Initial SSH attempt found an idle VM; a readiness request woke it. The next attempt failed argument validation before inference; the corrected invocation passed. These were operational failures, not provider authentication failures. Browser upload/follow-up/reload are still pending and vision remains gated.

Conservative exposure after the test: all ledger usage 367,852 plus all recovery holds 22,369 plus the earlier uncorrelated 40,000 allocation = 430,221 microusd, below the 1,000,000 test ceiling. No active reservations; no liabilities released. New-model-specific cumulative exposure is 28,509 microusd using the prior recorded 27,423 total.

CLI/Desktop now have working-source memory-only Kimi continuation using nonserialized object-keyed state. Reasoning is excluded from emitted messages/events and injected only into outgoing context; model changes, reloads and incomplete streams discard continuation. Desktop transport regression and helper tests pass (14 tests); CLI provider/helper suite passes (38 tests). Tool capability stays gated pending live tool-round qualification and session-lifecycle acceptance.

OpenCode now generates its catalog from Router, retaining all twelve descriptors and selecting the nine tool-qualified models. It remains text/tool-only. Catalog check, typecheck, lint, 50 tests and build passed; Kimi host-lifecycle continuation remains unfinished.

Presence prompts, full authenticated cross-client matrix, browser vision acceptance, complete candidate-baseline reconciliation, packaged Desktop acceptance and successor publication remain unfinished. No candidate tags, beta/latest aliases, existing artifacts or serving API/Pages were changed. Do not publish this partial state.
