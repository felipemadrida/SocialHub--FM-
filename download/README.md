# SocialHub -FM- — Guía rápida

Documentación completa: [README principal](../README.md).

## Instalación

```bash
npm install
cp .env.example .env
npm run db:push
npm run dev                 # http://localhost:3001
npm run dev:automation      # opcional, :3031
```

`.env` mínimo (ver `.env.example`):

```env
DATABASE_URL="file:../db/custom.db"
APP_URL="http://localhost:3001"
AUTOMATION_SERVICE_URL="http://localhost:3031"
ALLOW_SEED="true"
SEED_SECRET="dev-seed-secret"
```

## Personalización (no editar page.tsx)

| Qué | Dónde |
|-----|--------|
| Plataformas (LinkedIn, YouTube, …) | Config → General, o `src/lib/platforms.ts` |
| Tema Blanco / Negro | Botón del encabezado (`localStorage`) |
| Marca / eslogan | Config → General (`AppSettings`) |
| Acento de color | Config → General |
| Triggers / acciones | `src/lib/platforms.ts` + UI Automatización |
| Tokens mock de cuenta | Config → Cuentas |

## Seed

```bash
curl -X POST http://localhost:3001/api/seed \
  -H "x-seed-secret: dev-seed-secret"
```

## Nota

Puerto de la app: **3001** (no 3000). Publicación mock por defecto.
