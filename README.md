# Plateforme de Sourcing Chine → Sénégal

Monorepo (npm workspaces + Turborepo) pour la plateforme de sourcing/import.

- Spécification produit : [project.md](./project.md)
- Design technique : [ARCHITECTURE.md](./ARCHITECTURE.md)

## Structure

```
apps/
  web/       # Next.js — frontend client + back-office
  api/       # NestJS — API REST /api/v1, Prisma, BullMQ
packages/
  shared/    # types, schémas Zod partagés frontend/backend
```

## Prérequis

- Node.js ≥ 20
- PostgreSQL (local ou managé)
- Redis (local ou managé)

## Démarrage

```bash
npm install
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
npm run dev
```

## Scripts racine

| Commande | Effet |
|---|---|
| `npm run dev` | lance web + api en parallèle (Turborepo) |
| `npm run build` | build toutes les apps |
| `npm run lint` | lint toutes les apps/packages |
| `npm run typecheck` | vérifie les types partout |
| `npm run test` | lance les tests |
| `npm run format` | formatte avec Prettier |

## Conventions

- TypeScript strict partout, pas de `any` non justifié.
- Un module NestJS = un domaine métier (`src/modules/<name>`), voir `ARCHITECTURE.md` §4.
- Toute logique de calcul (pricing, statuts) est testée unitairement avant d'être branchée à un controller.
- Aucun secret dans le repo — `.env` est ignoré par git, `.env.example` documente les clés attendues.
- Commits et PR passent par le pipeline CI (`.github/workflows/ci.yml`) avant merge.
