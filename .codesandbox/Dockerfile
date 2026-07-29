# CodeSandbox supports debian & ubuntu based images.
#
# 🔴 THE NODE VERSION IS LOAD-BEARING, AND GETTING IT WRONG FAILS SILENTLY AT INSTALL TIME.
#
# This starter builds with Vite 8, whose engine is `^20.19.0 || >=22.12.0` because its rolldown core
# ships a per-platform NATIVE binary as an OPTIONAL dependency. npm SKIPS an optional dependency whose
# engine does not match — with a `WARN EBADENGINE` and an exit code of 0 — so on the default image
# (MEASURED: node v20.12.1) `npm install` reports success in two seconds, `@rolldown/binding-linux-x64-gnu`
# is simply absent, and the dev server then dies with:
#
#     Cannot find module '../rolldown-binding.linux-x64-gnu.node'
#
# Neither `npm ci` nor deleting the lockfile repairs it (both MEASURED) — the version is the cause, not
# the lockfile. A template built without this file produces a project that installs cleanly and cannot
# run.
#
# node:22-bookworm is Debian 12 => glibc 2.36, which also clears the >= 2.32 floor the native binaries
# need (the universal image is Ubuntu 20.04 / glibc 2.31).
FROM node:22-bookworm
