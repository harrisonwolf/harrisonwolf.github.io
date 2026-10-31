# Orc v2 capture: incomplete — genuine containment failure

Run `run-0001` in Project `orc-v2-demo-20261031` closed **failed** before any Worker dispatch. This is a real live-model attempt, not seeded history. No successful live Worker tour is delivered.

## Actual models and usage

- Helmsman: `gpt-6-astra`, medium, existing ChatGPT subscription binding.
- Selected but never invoked: `claude-sonnet-5-5`, medium, and `gpt-6.1-sol`, low.
- Three completed Helmsman invocations: first look, corrected first look, execution/failure handoff. Zero Worker invocations.
- Each selected endpoint retained 600 seconds and 30 tool rounds per invocation.
- Recorded aggregate invocation time: **86.7 seconds**. Proceed to closure: approximately **61.3 seconds**.
- Reported aggregate tokens: **78,124**, comprising 76,764 input and 1,360 output; 36,864 cached input and 144 reasoning output reported separately. These fields are provider reports, not remaining account quota or verified billed cost.
- Paid API fallback: none. Remaining subscription allowance and billed monetary cost: unknown.

## UTC timeline, 2026-10-31

- 19:19:13.206502 — Run launched once.
- 19:19:26.842832 — First-look v1 recorded.
- 19:28:52.090416 — Revised first-look v2 recorded after the operator's authorized workspace correction.
- 19:31:30.716686 — Proceed v2 recorded under the user's authorization to complete the demo.
- 19:32:32.016179 — Run closed failed; no Candidate or Worker contributions.

## Failure and diagnosis

The model's first-look v1 incorrectly expected manually supplied sandbox artifacts. The corrected plan v2 used the already imported managed Workbench and Worker private copies. That correction succeeded.

The contained execution then failed at Docker startup:

```text
invalid mount config for type "bind": bind source path does not exist:
/tmp/orc-capture-20261031-preflight/source-workspaces/source-a2ebb019f697409ab953b4671c33064b/work
```

That directory exists in Ubuntu. Docker cannot see the session-private `/tmp` path. Orc's `docs/current/verification.md`, lines 334–338, documents this problem and prescribes a fresh physical directory under `/home/wolve/projects/orc-archive/evidence`.

The agent chose the unsuitable temporary root and should have verified Docker visibility before model execution. No Orc source, security/protection settings, or sandbox boundaries were weakened to make the demo run.

Retained jobs:

- `job-de7a4f2f3822dd78ba13`: operator `make test` baseline. Failed at Docker create because its captured-copy path was also under the invisible `/tmp` home. Repository tests did not execute.
- `job-f53ca5ae34c1854991b6`: Helmsman read-only repository inspection. Timed out with sandbox startup failure; no exit code or command output.
- An earlier attempted baseline before Proceed was refused because Run jobs require proceeded execution. That refusal is also retained; it was not a test failure.

Read-only diagnosis and one harmless visibility test established that the newly prepared physical directory `/home/wolve/projects/orc-archive/evidence/orc-media-v2-recovery-20261031` **is** Docker-visible. A read-only, network-disabled, capability-dropped sentinel container returned the exact expected marker. It ran no repository/model code. No model retry or replacement Run was launched.

## Delivered files

- `run-01-staging.png`: real TUI staging screen showing actual objective, constraints, model bindings and two-Worker limits. Visually checked for prohibited private data.
- `run-03-first-look-v1.png`: real first-look v1 review screen before correction. Preserved as historical evidence, including its incorrect workspace assumption. Visually checked.
- `run-04-failed-mount.png`: actual failed Run's result screen at approximately 19:36:45 UTC, with zero Workers, no Candidate, and its real handoff. Visually checked.
- `FIRST-LOOK-REVIEW.txt`: historical first-look-v1 packet. Its paused status describes that earlier checkpoint; this document records the current failed result.
- `MEDIA-NOTES.md`: this actual outcome, inventory and limits.

## Withheld / unavailable media

Raw casts are retained in `/tmp/orc-capture-20261031-preflight/capture/`: `staging-real.cast`, `first-look-real.cast`, `first-look-review-real.cast`, `before-baseline.cast`, `before-baseline-proceeded.cast`, `live-tour.cast`, and `failed-run-result.cast`.

**Complete every-frame privacy review has not been performed.** These raw casts are withheld from delivered portfolio assets. Selected delivered PNGs were individually visually inspected. No contaminated frame was edited to appear genuine.

`live-tour.cast` contains an unsuccessful navigation capture after the Run had already failed; it is not a live Worker tour and is not relabeled as one. Earlier noninteractive recorder cleanup issues were resolved with an owned PTY; some review captures ended through a bounded recorder interrupt. No additional model call resulted from capture navigation.

No `orc-tour.mp4`, `orc-tour.cast`, poster, hero, before/after repair proof, or fabricated 8–10-shot sequence is delivered. The selected Workers never ran; no proposals, integration or apply-back occurred. Original disposable source and existing user projects remain unchanged. Calibration footage is separate and not used as Orc evidence.

## Remaining blocker

The failed Run cannot be reopened as a successful Run. Completing the real repair/tour requires a fresh, separately identified demo Project in the verified Docker-visible location. Protected Project creation and adding that home to the existing daemon's trust record require the user's existing control passphrase entered privately. `ORC-V2-RECOVERY.txt` in the Desktop review folder supplies the exact manual commands. No new model catalog entries, provider connections, logins or copied credentials are required.
