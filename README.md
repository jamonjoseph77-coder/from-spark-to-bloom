# Cinema

**Experience the World of Stories.**

Cinema is a digital entertainment home for discovering and experiencing movies, series, television, sports, trailers and publisher content.

**Live app:** https://from-spark-to-bloom.lovable.app

## Project

This project is built with React, TypeScript, Vite, TanStack Start/Router, Tailwind CSS and Supabase. It is connected to Lovable:

https://lovable.dev/projects/ba24c549-1dd7-4497-8036-00c000106fe2

The repository is the source code for the existing Cinema project. Preserve its current database and project identity; do not create a replacement project to apply updates.

## Development

Requirements: Node.js and npm.

```sh
npm install
npm run dev
npm run lint
npm test
npm run build
```

See [API_SETUP.md](./API_SETUP.md) for environment variables, provider setup, integration contracts, security notes and publishing requirements.

## Security

- Never commit `.env`, `.env.local`, access tokens, service-role keys or other secrets.
- Browser variables prefixed with `VITE_` must contain public configuration only.
- Supabase service-role credentials belong only in trusted server-side environments.
- TMDB metadata and YouTube trailers are not streaming licences.
- Do not invent live television, sports, news or Digital Box Office figures.

## Existing project safeguards

- Keep the existing publisher directory and profiles.
- Keep the current database as the source of truth until a reviewed migration is approved.
- Do not restore the removed Cinema Exchange, content trading, shares or investment units.
- Do not publish until build, tests, access rules and the live release have been verified.
