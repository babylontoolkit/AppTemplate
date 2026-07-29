# `.codesandbox/` — how this starter becomes a VM template

`csb build . --alias btk@<name>` writes this directory into a scratch sandbox, runs `setupTasks`, and
snapshots the result. Forking that snapshot is how the Babylon Toolkit App Builder creates a project.

## Why `runAtStart: false`

The platform starts the dev server itself, as part of the creation artifact (`npm run dev`), and
restarts it on a wake through its own boot path. A template that auto-started one would already hold
port 5173 when that command ran, and the fork would die with *"Port 5173 is already in use"* — leaving
the new project served by the template's process instead of its own.

The cost is real and deliberate: the snapshot no longer has a dev server running at fork time, so
first-playable is a few seconds slower than a snapshot taken with the server up. `node_modules` is
still baked in by `setupTasks`, which is the expensive half.

⚠️ **Because nothing opens the port at boot, `csb build` must NOT be given `--ports`.** That flag makes
the build wait for a port that will never open, and the build fails after 60s with a timeout that
looks like a broken template.

## `preview.port`

5173 — the port `vite.config.ts` binds with `strictPort: true`. It is declared so the platform's
preview can find the task, not so anything starts it.
