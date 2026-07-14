# SocialHub -FM- — Paquete completo (v0.6.3)

Copia distribuible y autónoma del proyecto. Misma funcionalidad que producción.

## Contenido

- App Next.js 16 (App Router) + Prisma PostgreSQL
- Auth Admin/Retail (NextAuth)
- OAuth multi-red (Facebook, Instagram, TikTok, X, LinkedIn, YouTube, Pinterest)
- Publicación paralela live a una o varias redes
- Studio Creativo + Marketing Hub + IA Studio
- Guía Despliegue interactiva
- Sidecar `mini-services/social-automation`

## Setup (Windows / macOS / Linux)

```bash
cd socialhub-project
cp .env.example .env
# Edita DATABASE_URL, NEXTAUTH_SECRET, APP_URL, NEXTAUTH_URL

npm run setup
# = npm install + prisma generate + prisma db push

npm run dev
# http://localhost:3001/login
```

Postgres local opcional:

```bash
docker compose up -d
# DATABASE_URL=postgresql://socialhub:socialhub@localhost:5432/socialhub?schema=public
```

## OAuth producción

1. Crea apps en Meta / X / LinkedIn / etc.
2. Añade callbacks `{APP_URL}/api/oauth/{red}/callback`
3. Define keys en `.env` o Vercel (ver `.env.example`)
4. En la app: **Cuentas → Login OAuth**

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run setup` | install + generate + db push |
| `npm run dev` | puerto 3001 |
| `npm run build` / `start` | producción local |
| `npm run purge:demo` | limpia cuentas placeholder |
| `npm run dev:automation` | agenda mock 3031 |

## Deploy

Ver `README.md` y pestaña **Despliegue** en la UI. Proyecto Vercel: `socialhub-fm`.

Live: https://socialhub-fm.vercel.app
