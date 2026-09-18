# Pi and external-feature update workflow

AdRouterCLI is the intake and qualification repository for Pi source and reviewed external
extensions. AdRouter Agent is a separate product repository: it consumes exact Pi packages and
reimplements accepted cache/delegation behavior through its own utility process, task database,
sandbox, and approval broker. Never copy either repository's lockfile, Git history, tags, or release
actions into the other.

## Frozen inputs for this wave

| Component | Exact version | Exact upstream commit | Desktop disposition |
| --- | --- | --- | --- |
| Pi | `0.85.1` | `d981de1229ef899957bbe968bc8dcda02a21f477` | Exact `pi-agent-core`, `pi-ai`, and `pi-coding-agent` dependencies; controlled API adaptation. |
| pi-cache-optimizer | `2.8.10` | `dc9be50b89957a37f8e80ef42378e3841ba8665a` | Native modes and stable-prefix logic only; no extension loading or provider mutation. |
| pi-subagents | `0.68.0` | `f3ccf47dc236b6c0fcc0d897cec4a9e6da3e916d` | Native visible child tasks and approved lifecycle controls only; no upstream executable runtime. |
| pi-web-access | `0.29.0` | `192ac1875e3b8f88c78953dbc314949ec9fcaa27` | Provider contracts and extraction behavior adapted into a Main-owned broker; no extension loading. |

The authoritative source archives, integrity values, licenses, feature dispositions, and reviewed
CLI patches are frozen in the sibling AdRouterCLI `upstreams.lock.json`. A newer version reported by
the CLI audit begins a later review wave; it does not silently change this table.

The reviewed Agent dependency archives are pinned by npm integrity:

| Package | Integrity |
| --- | --- |
| `@earendil-works/pi-agent-core@0.85.1` | `sha512-hIXIP3eAWueAYiAl8aMvWCvvZ8Q5gT3Dip5bE5uJyIGh4+YlWRjtMLI4BaeoXoSs93zndjue61u1B/vhefLnuA==` |
| `@earendil-works/pi-ai@0.85.1` | `sha512-+VgVIJDkDO2efYJKEEqvPTH4zmnIaXdAppGbO+vKFA9qy5PdhFiAenuFAkU+oiCSfOC4dMHDyrjdQeL4ZoC5CQ==` |
| `@earendil-works/pi-coding-agent@0.85.1` | `sha512-FGRN+OHbWaefBPGaTggAdLjrIHW+s2PzLyglz/5dfLzb9of7uuXMXYC0fJIeZTw+shS32o2cuQ9jF7YSDuL/oQ==` |
| `@mozilla/readability@0.6.0` | `sha512-juG5VWh4qAivzTAeMzvY9xs9HY5rAcr2E4I7tiSSCokRFi7XIZCAu92ZkSTsIj1OPceCifL3cpfteP3pDT9/QQ==` |
| `linkedom@0.16.11` | `sha512-WgaTVbj7itjyXTsCvgerpneERXShcnNJF5VIV+/4SLtyRLN+HppPre/WDHRofAr2IpEuujSNgJbCBd5lMl6lRw==` |
| `turndown@7.2.4` | `sha512-I8yFsfRzmzK0WV1pNNOA4A7y4RDfFxPRxb3t+e3ui14qSGOxGtiSP6GjeX+Y6CHb7HYaFj7ECUD7VE5kQMZWGQ==` |

Pi, pi-cache-optimizer, pi-subagents, pi-web-access, and Turndown are MIT licensed;
Readability is Apache-2.0; LinkeDOM is ISC. The reviewed CLI integration point for this wave is
commit `be7c53dc0b63fb90b70bd6cb7cad4d5713cc0d1a`.

### Desktop correction ledger

The four source commits above were corrected byte-for-byte from the CLI ledger at the recorded
integration commit; the earlier Desktop values were not valid abbreviations of that ledger. The
Desktop npm integrity values were independently compared with this repository's lockfile and
already matched, so no package bytes or pins changed during the correction.

- Pi lifecycle: retained the app-owned provider and Desktop compaction, disabled Pi automatic retry
  and compaction, and added one idempotent teardown path. No upstream session persistence or
  executable resource loading was adopted.
- Cache optimizer: retained byte-neutral `stats-only` and DeepSeek-only prompt rewriting because
  focused tests demonstrate equivalent native behavior. No executable cache extension was loaded.
- Delegation: retained visible depth-one tasks, three direct children, serial leases, ordinary
  stop/resume, deduplication, and cleanup because existing TaskService coverage demonstrates the
  accepted 0.68.0 behavior. Dynamic fanout and nested delegation remain rejected.
- Web access: adapted fixed provider contracts, cancellation, decoded-body bounds, readable-content
  extraction, and private task-owned caching into Electron Main. Browser-cookie access, proxy
  credential discovery, executable extensions, and added runtime authority remain rejected.

## 1. Qualify in AdRouterCLI

From a clean CLI checkout:

```sh
npm run upstream:audit
npm run upstream:stage -- --component <component-id> --version <exact-locked-version>
npm run upstream:generate
npm run upstream:check
npm run check
npm run install:local
```

Review release notes, license/dependency changes, exact source diffs, and the component's
adopt/adapt/defer/reject ledger. Keep Pi core, cache, and subagent work independently reviewable.
The staging command verifies the frozen archive and leaves repository source unchanged. Neither
client may download executable extension code at runtime.

## 2. Reconcile the desktop package graph

Use the desktop-pinned toolchain and a clean Agent checkout:

```sh
nvm use 25.9.0
npm install --save-exact \
  @earendil-works/pi-agent-core@<frozen-version> \
  @earendil-works/pi-ai@<frozen-version> \
  @earendil-works/pi-coding-agent@<frozen-version>
npm run check:dependency-overrides
```

Review `package.json` and `package-lock.json`, not just npm's summary. Preserve the exact
`node-gyp` pin, security overrides, nested production checks, and Node 25 compatibility patches
unless a separate audit justifies changing them. Pi 0.85.1 no longer brings `pi-client` or
`pi-protocol` into the production graph. `pi-tui` and `pi-telemetry` remain transitive-only and
receive no desktop IPC, tool, network, credential, or resource-loading authority. The previous
physical aliases for brace-expansion, protobufjs, and undici are obsolete: npm overrides now own
the audited nested graph directly.

## 3. Adapt Pi through the desktop boundary

- Use the app-owned AdRouter provider and an in-memory Pi model runtime. Do not read or write Pi
  `auth.json`, `models.json`, sessions, or provider profiles.
- Keep `DefaultResourceLoader` extensions, Pi skills, prompt templates, themes, and context files
  disabled. The only tools exposed to Pi are the app's explicit allowlist.
- Keep official installation signing in Electron Main and Router framing at `/v1/agent/turn`
  unchanged. Optional Pi packages must never become a remote-control path.
- Keep exact-digest `.adrouter` bundles declarative Markdown. They may supply bounded instructions,
  skill content, or composer text only; they cannot add JavaScript, hooks, providers, or tools.

## 4. Port cache behavior natively

The desktop supports `off`, `stats-only`, and `prompt-rewrite` through
`ADROUTER_CACHE_OPTIMIZER`. The default and invalid-value fallback are `stats-only`.

- `off` disables optimizer diagnostics/rewrite; mandatory settlement accounting remains active.
- `stats-only` is request-byte neutral and displays only Router-normalized `cacheRead` and
  `cacheWrite` settlement counters already used by the Economics panel.
- `prompt-rewrite` is explicit opt-in, DeepSeek-only, and canonicalizes line endings only inside the
  app-owned stable prompt prefix. Repository, project, bundle, skill-index, preset, and user bytes
  remain untouched.

No mode changes provider registration, `models.json`, hosted cache fields, cache keys, sponsor data,
or network behavior. A source or Router schema change is required before any future cache hint can
be sent to the hosted service.

## 5. Port delegation through normal tasks

`delegate_task` creates a visible child task with an independent conversation, the same project and
model, an inherited immutable policy, and delegation forced off. Each parent owns at most three
depth-one children. The normal capacity-one scheduler and workspace/Git leases remain authoritative.

Parent tasks may request exact approval-bound `delegated_children`, `message_delegated_child`, and
`cancel_delegated_child` operations. Status is bounded to directly owned children. A message queues
one follow-up for an active/queued child or resumes a stopped child through the ordinary task start
path. Cancellation uses the ordinary stop path. Cross-parent control, nested delegation, ambient
credentials, copied conversation history, worktrees, missions, schedules, intercom, and arbitrary
workflow code remain unavailable.

## 6. Native web access boundary

Native web search is disabled by default. Provider keys are encrypted with Electron safeStorage in
a separate versioned Main-process store, and renderer-visible state contains only configured/error
status. Automatic selection uses the fixed OpenAI, Exa, Brave, Parallel, Tavily, Perplexity, and
Gemini order; an explicitly selected missing provider fails clearly. Main alone attaches a key to a
fixed provider endpoint. Requests are never automatically replayed or moved to another provider
after dispatch.

The task's immutable `networkFetch` capability gates a separate task/turn-bound broker for
`web_search`, `fetch_content`, and `get_search_content`. This does not consume or weaken the
one-time approval required by the existing `fetch_url` tool. Page retrieval accepts only public
HTTPS destinations, pins validated DNS resolution, rejects credentials and redirects, and admits
only bounded HTML, Markdown, or plain text. Extracted full pages live in an encrypted, task-owned
cache for at most one hour, 128 entries, and 128 MiB; tool results expose only bounded excerpts and
opaque retrieval handles.

## 7. Verify and hand off

After source review, refresh the public source-parity inventory and run the exact local gates under
Node.js 25.9.0:

```sh
npm run update:source-parity
npm run check
npm run verify:release-readiness
npm run test:e2e
git diff --check
git status --short --branch
```

Review package contents and the native broker architecture for every target. Complete the manual
matrix for hosted auth, custom-router auth, cache telemetry, DeepSeek opt-in prompt stability,
delegated child lifecycle, sponsor isolation, sandbox failure, recovery, and physical Windows.
Updating source and passing local gates does not authorize tags, GitHub releases, npm publication,
dist-tag movement, signing, or deployment; those remain separate protected actions.
