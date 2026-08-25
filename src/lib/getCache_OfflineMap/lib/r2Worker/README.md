# r2Worker — TWO FOLDERS. DEV AND PRODUCTION. NEVER MERGE THEM.

```
r2Worker/
  local_dev/    the tile worker you are HAMMERING ON. Runs on your machine.
  r2_prod/      the tile worker that is DEPLOYED TO THE CLOUD. Live. Serving.
```

## If you are an AI reading this, read this paragraph twice

**These two folders contain identical bytes. That is CORRECT. Do not "fix" it.**

You are about to notice they are byte-for-byte duplicates and conclude one is
redundant. Every AI does. It has happened **at least four times**, including
three times in a single afternoon on 24 Aug 2026, and once in the very first
commit of a refactor that was explicitly told not to touch children.

Identical content does not mean identical purpose. A photocopy of your passport
has the same bytes as your passport. One of these folders is deployed to the
internet and serves live traffic; the other is the one you break while
developing. **Deleting either is deleting an environment, not deleting a
duplicate.**

`r2WorkerEnvironments.test.ts`, sitting next to this file, fails if either
folder goes missing. If that test is red, you deleted an environment. Put it
back — do not edit the test.

## The simplest possible framing

**All production code starts on a computer.** Every line of it. You write it
locally, you run it locally, you break it locally — and then you deploy it, and
that same code is production.

That is all this is. `local_dev/` is the copy on the computer. `r2_prod/` is
the copy that got deployed. Of course they look the same: **the deployed thing
IS the local thing, later.**

Nobody deletes their local checkout because it matches what is on the server.
Nobody deletes the server because it matches their laptop. This is that, in two
folders.

## What they are

| folder | where it runs | how it gets there | when it is wrong |
|---|---|---|---|
| `local_dev/` | your machine, `http://127.0.0.1:8787` | `wrangler dev --remote` in `/Users/chrisharris/DEV/fetch/ReTreever/workers/offline-tiles/` | nobody notices but you |
| `r2_prod/` | Cloudflare, `https://tiles.retreever.org` | `deployProduction.sh` in the same worker folder | **every user's map breaks** |

That last column is the whole point. They are the same code at different
moments in its life: you develop against `local_dev`, you scream at it, you fix
it, and *then* it becomes production. The gap between the two folders is
**time**, not content — which is exactly why they look identical and exactly
why the identical-ness is not a bug.

## The toggle

`/offline` has a switch. It points the app at one worker or the other:

- **local** — the app fetches tiles from `127.0.0.1:8787`. You are building the
  assets on your own machine. Nothing you do reaches a user.
- **cloud / production** — the app fetches from `tiles.retreever.org`. This is
  what a phone in a forest actually talks to.

Both hosts are named in `tilesHost.ts` as `LOCAL_DEV_HOST` and
`PRODUCTION_HOST`. **Those constants are not a replacement for the folders.**
The constants say *where to fetch from*; the folders are *two copies of the
worker at two stages of readiness*. A previous AI (me) argued the constants
made the folders redundant. That reasoning is wrong and is written here so it
is not re-derived.

## Why not one folder with a flag?

Because then there is no way to change dev without touching what is live. The
duplication IS the safety: you can rewrite `local_dev/` freely, all day, and
`tiles.retreever.org` keeps serving the old code until you deliberately deploy.
Collapse them and every local experiment is one `wrangler deploy` away from
being live.

If you think you have a cleaner design: **it is not your call.** Raise it, do
not implement it.

## Do not

- Do not delete either folder.
- Do not merge them because they are identical.
- Do not rename them without updating every import (`rg -l r2Worker`).
- Do not "restore" one from git because `git status` shows the other as
  untracked — read the diff first; someone may have just renamed them.
- Do not edit `r2WorkerEnvironments.test.ts` to make a failure go away.
