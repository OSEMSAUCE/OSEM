# retreeved/ — GENERATED. DO NOT EDIT.

Every file here is copied from `ReTreever/retreever/` by
`gitEr/syncRetreeved.sh`, which runs on every `run_dev_start`. Edit a file here
and your change is gone the next time you start the servers.

**Edit the source instead:** `/Users/chrisharris/DEV/fetch/ReTreever/retreever/`

## Why a copy and not an import

rapper is meant to be cloned WITHOUT this monorepo. A path or alias reaching
into ReTreever resolves on one machine and nowhere else — the clone would build
here and die for a contractor. Copies are real files, so the clone works.

## What belongs here

Only things that must be BYTE-IDENTICAL across both tiers — the dev pill, the
dev bar, shared dev chrome.

`app.css` / `app.unique.css` must NEVER be here. Those are the half the two
parents are required to disagree on: white in ReTreever, violet in rapper, which
is how you see which tier served a page. The sync script refuses to copy them.
