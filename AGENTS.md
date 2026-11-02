# modfolio

modfolio generates embeddable cards and badges for Modrinth, CurseForge, Hangar and Spigot content.

This project is a pnpm workspace run with Turborepo:

- `apps/api` is the Rust (axum) server. It renders the cards and badges and serves the built website.
- `apps/web` is the Vue website for configuring and previewing embeds, built with Vite and Tailwind CSS.

## Commands

- `pnpm dev` runs the API and the website together. The website proxies the platform routes to the API on port 3000.
- `pnpm test` runs the Rust tests; the website has no tests. The tests call the real platform APIs, and the CurseForge ones need `CURSEFORGE_API_KEY` in the environment or in `apps/api/.env`.
- `pnpm lint` runs oxlint and clippy. `pnpm lint:fix` applies their fixes.
- `pnpm fmt` formats with oxfmt and `cargo fmt`. `pnpm fmt:check` only checks.
- `pnpm typecheck` checks the website.
- Never run the `release:*` scripts or push tags. Releases are done by the maintainer.

## Rules

- Never edit translated locale files by hand, they come from Crowdin. After adding or changing a `defineMessages` call, run `pnpm web:intl:extract` to regenerate `apps/web/src/locales/en-US/index.json`.
- The release version only lives in the root `package.json`. `apps/api/build.rs` injects it into the API.
- Only write a comment when the code can't explain something itself. Keep it short and simple: no em dashes, no semicolons, no nested clauses.
