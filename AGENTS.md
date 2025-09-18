# Repository Guidelines

## Project Structure & Module Organization
This Next.js 15 app uses the App Router under `app/`, where folders map directly to routes and server actions. Shared UI primitives and layouts live in `components/`, while Storyblok-specific blocks and helpers are grouped under `src/components` and `src/lib`. Client-side data hooks and context providers belong in `hooks/` and `contexts/`, and reusable utilities or API adapters are in `lib/`. Supabase SQL policies, types, and Edge function helpers sit in `supabase/`, with supporting scripts in `scripts/` and the root-level `test-*.js` diagnostics. Static assets, icons, and fonts are stored in `public/`.

## Build, Test, and Development Commands
- `npm run dev` – Launches the HTTPS-enabled Next.js dev server on port 3000 using the bundled local certificates.
- `npm run build` – Produces an optimized production build; verify Storyblok and Supabase env vars before running.
- `npm run start` – Serves the compiled build for smoke testing.
- `npm run lint` – Executes `next lint` with the repo ESLint config; run before every commit.

## Coding Style & Naming Conventions
TypeScript strict mode is enforced via `tsconfig.json`, so prefer typed props and inference over `any`. Follow 2-space indentation, PascalCase for React components, and camelCase for functions, hooks, and variables. Co-locate Tailwind styles inside JSX class names and reuse tokens from `tailwind.config.ts`. Respect the `@/*` import alias instead of relative `../../../` paths, and extend existing component abstractions before creating new ones.

## Testing Guidelines
Automated test suites are not yet in place; rely on targeted diagnostics such as `node test-edge-function.js` or the other root `test-*.js` files once Supabase credentials are loaded. Include manual verification steps in PRs (e.g., streaming playback, Storyblok content fetch, Supabase auth flows). When adding tests, align file names with the feature (e.g., `feature-name.spec.ts`) and keep them near the code under `app/` or `components/`.

## Commit & Pull Request Guidelines
Existing history follows Conventional Commits (`feat:`, `fix:`, `chore:`); continue using that style with concise, present-tense summaries. For PRs, provide a clear overview, link to relevant issues or Notion tasks, attach UI screenshots for visual changes, and list manual check steps. Confirm `npm run lint` passes and note any migrations or Supabase policy updates in the description. Coordinate staging Storyblok changes separately and document required environment variables in the PR body.

## Security & Configuration Tips
Never commit secrets; use `.env.local` and reference `.env.example` when introducing new keys. Supabase access policies live in `supabase/`—update them alongside any SQL migrations and mention the change in your PR. The development server trusts the bundled TLS certs (`localhost.pem`/`localhost-key.pem`); regenerate them if they expire and keep private keys out of version control.
