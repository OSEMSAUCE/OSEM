## OSEM GIT Explainer

### Goal
Keep OSEM working inside ReTreever with a workflow a human can repeat without surprises.

### Rule 0 (do this and 90% of the confusion goes away)
Treat `OSEM/` as a **subrepo-managed folder**, not as a standalone git repo.
That means: run subrepo commands from the **ReTreever root**, and avoid doing `git init`, `git pull`, or `git checkout` from inside `OSEM/`.

### What you do day-to-day
From ReTreever root:

1) **Be on the working branch**

```sh
cd ~/DEV/fetch/ReTreever
git checkout dev
```

2) **Pull latest OSEM into the folder**

```sh
git subrepo pull OSEM
```

3) **Do your work**
Edit files under `OSEM/` normally.

4) **Commit in ReTreever**

```sh
git add OSEM
git commit -m "chore(OSEM): <what changed>"
```

5) **Push OSEM upstream**
- WIP goes to upstream `dev`:

```sh
git subrepo push OSEM -b dev
```

- Release goes to upstream `main`:

```sh
git subrepo push OSEM -b main
```

<<<<<<< HEAD
`-b <branch>` means: use that upstream branch in the OSEM repo (ex: `dev` vs `main`).


=======
>>>>>>> parent of 863d323 (git subrepo pull --branch=dev --force OSEM)
### If subrepo says “pull first”
You’re trying to push to an upstream branch that has commits you haven’t fetched.

```sh
cd ~/DEV/fetch/ReTreever
git subrepo fetch OSEM
<<<<<<< HEAD
git subrepo pull OSEM -b <the-same-branch-you-will-push> -f
git subrepo push OSEM -b <the-same-branch>
```

`-f` means: force the pull strategy (git-subrepo will still stop for real merge conflicts, but it will not refuse the pull just because the histories don’t line up cleanly).

If `git subrepo status OSEM` shows a different Tracking Branch than the one you’re pushing, always pull the branch you intend to push (ex: `git subrepo pull OSEM -b dev -f`) before pushing.

Note: publishing to the separate upstream repo (`OSEMSAUCE/OSEM`) is optional for day-to-day work; the authoritative deploy for production is the ReTreever `dev` → `main` promotion.

=======
git subrepo pull OSEM -b <the-same-branch-you-will-push> -F
git subrepo push OSEM -b <the-same-branch>
```

>>>>>>> parent of 863d323 (git subrepo pull --branch=dev --force OSEM)
### Quick checks (when a GUI says “Sync X commits”)
Always verify what repo you’re looking at:

```sh
git rev-parse --show-toplevel
git status -sb
```

- If `--show-toplevel` prints `.../ReTreever`, you’re looking at **ReTreever**.
- If it prints `.../ReTreever/OSEM`, you’re looking at a **nested OSEM repo** (bad state for the subrepo workflow).

### Recovery (when OSEM suddenly shows “master” + tons of untracked files)
That usually means `OSEM/` accidentally became a standalone repo because `OSEM/.git/` exists.

1) Delete the nested git directory:

```sh
rm -rf ~/DEV/fetch/ReTreever/OSEM/.git
```

2) Restore OSEM back to whatever ReTreever currently tracks:

```sh
cd ~/DEV/fetch/ReTreever
git restore --source=HEAD --staged --worktree -- OSEM
```

3) Continue normally with the day-to-day workflow above.