<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Multi-session workflow

Two Claude sessions work on this repo concurrently, in separate git worktrees:

- **Code session** — main checkout (`produsa/`): app code, refactors, infra, deploys. Reviews and merges the phrases session's PRs.
- **Phrases session** — worktree (`produsa-phrases/`): all comodín/game voice content — the `VOICES` object in `src/components/live/LiveScoreboard.tsx`, `src/data/comodinConfig.ts`, the `BANKERS` array in `src/components/deal/gameTypes.ts`, and the mini-game `COMODIN_*` phrase arrays (arkanoid, pelotusa, frogusa, invaders).

Rules for both sessions:

1. Don't edit the other session's territory in passing. If a refactor forces phrase-text changes (or a phrase change needs a structural tweak), flag it in the PR description instead of doing it silently.
2. Never delete the `produsa-phrases` branch (the worktree's parked branch) and never run `git worktree remove`/`prune` on `produsa-phrases/`.
3. Deleting merged feature branches is fine — git blocks deletion while a branch is checked out in the other worktree, and that block is intentional.
4. Work on feature branches cut from `origin/main`, PR into main, never commit to main directly.
5. Only one session runs the dev server at a time (shared port).
