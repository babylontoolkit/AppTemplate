# Project Spec

> **This is the source of truth for the project.** It defines the durable,
> cross-feature architecture, systems, conventions, and decisions. Feature specs
> in `_specs/` are derived **from** and constrained **by** this document.
>
> **Read this before speccing, planning, or executing any feature.** If a request
> conflicts with this spec, flag it before proceeding. When a landed feature
> changes anything below, update this file to match what was built.

---

## Architecture & Module Layout  _(current-state — replace/merge)_
_Top-level structure, entry points, how the app is built and run. How modules are
organized and depend on each other._

- _(Seed placeholder — replaced on first real content.)_

## Game Systems  _(current-state — replace/merge)_
_Each system, its responsibility, and its boundaries (what it owns vs. what it
delegates). One subsection per system._

- _(Seed placeholder — replaced on first real content.)_

## Conventions  _(current-state — replace/merge)_
_Naming, file/folder organization, script-component patterns, state management,
styling, error handling, testing patterns actually used in this repo._

- Prefer ESM imports throughout.
- Use Babylon Toolkit script component patterns rather than ad-hoc BabylonJS wiring, per the Agent Reference.
- Keep game systems modular.

## Decisions  _(append-only log)_
_Architectural decisions and their rationale — the "why", so future features don't
relitigate settled choices. Append new entries; supersede rather than delete._

- _(Record decisions here as they are made, newest last.)_

## Dependencies  _(current-state — replace/merge)_
_Runtime and build dependencies with versions, and why each is here. Nothing new
lands without an entry._

- **BabylonJS** — engine.
- **Babylon Toolkit** — Unity-style script components, scene management.

---

## How to update this spec

This file is an initial **seed scaffold**. Sections carry a mode tag in their
heading — follow it exactly when writing back:

- **`(current-state — replace/merge)`** — Architecture, Game Systems, Conventions,
  Dependencies. These describe *what is true now*. On the first real content,
  **remove the seed placeholder** and write the actual content. On later features,
  **merge/replace** so the section keeps matching the shipped code — never leave
  stale text, never let it contradict reality.
- **`(append-only log)`** — Decisions. **Append** a new entry (newest last);
  preserve history. To reverse a past decision, add a new entry that supersedes it
  — do not delete the old one.

Add a new Game System as its own subsection under Game Systems. Record every new
dependency (with version + why) under Dependencies as part of the task that
introduces it.

## How this spec stays true (the spec-driven loop)

- **bt-spec (read down):** reads this file, aligns the feature to it, flags
  conflicts, and records a `spec_impact` classification in the feature spec.
- **bt-plan (read down):** treats this file as a required analysis input; the plan
  must conform. For spec-impacting features it appends an explicit
  **`Update SPEC.md`** task so the write-back is tracked.
- **bt-execute (write up):** reads this file before each task, flags any divergence
  from reality, and runs the `Update SPEC.md` task through the same verifier gate
  as every other task — this file is never allowed to silently drift.
