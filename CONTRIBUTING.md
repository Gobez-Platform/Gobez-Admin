# Contributing

Thanks for helping improve this project. This guide explains the workflow, local setup, and how we deploy to Vercel.

## Table of contents

- Getting started
- Branching & pull requests
- Local development
- Tests & linting
- Build & deploy (Vercel)
- Commit messages
- Getting help

## Getting started

1. Fork the repo and clone your fork:

   git clone git@github.com:your-username/Gobez-Admin.git
   cd Gobez-Admin

2. Install dependencies:

   npm ci

3. Copy environment variables (if provided):

   cp .env.example .env

   # then fill values in .env

## Branching & pull requests

- `main` — production (always deployable).
- `dev` or `staging` — integration/testing branch.
- `feature/*` — short-lived branches for individual work (e.g. `feature/payments`).

Workflow:

1. Create a feature branch from `dev` (or `main` if no `dev` exists).
2. Make small, focused commits.
3. Push your branch and open a Pull Request into `dev`.
4. Request review, address feedback, and ensure CI checks pass.
5. Merge `dev` into `main` when ready for production.

Protect `main` with required PR reviews and passing CI.

## Local development

- Start dev server:

  npm run dev

- Build for production locally:

  npm run build

- Preview the production build locally (if supported):

  npm run preview

## Tests & linting

- Run tests:

  npm test

- Run linter/formatters:

  npm run lint
  npm run format

Make sure tests and lint pass before opening a PR.

## Build & deploy (Vercel)

- Production branch: `main`.
- Build command: `npm run build`.
- Output directory: `dist` (Vite default).
- Every PR and branch push produces a Preview URL for QA.

Environment variables must be set in Vercel for Production and Preview:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- any other keys used by the app

If you need to rollback, use Vercel's deployment history to restore a previous version.

## Commit messages

- Use clear, imperative messages. Example:

  feat(auth): add social login button

- Consider Conventional Commits if you want automated changelogs.

## Getting help

- Open an issue for bugs or feature requests.
- For questions about deployment or environment variables, ping the DevOps/Platform team.

---

If you want, I can also add a GitHub Actions workflow that runs `npm ci`, `npm run lint`, `npm test`, and `npm run build` on PRs. Reply and I'll add it.
