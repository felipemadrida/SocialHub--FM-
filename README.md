# SocialHub -FM-

Dashboard en español para gestionar **cuentas OAuth**, contenido, Studio Creativo, agenda, marketing e IA en **Facebook**, **Instagram**, **TikTok**, **X**, **LinkedIn**, **YouTube** y **Pinterest**.

> Producción: publicación **live** con Login OAuth (sin demo). Roles **Admin / Retail**. Marca teal→violet. Tema **Blanco | Negro**.

**Web:** https://socialhub-fm.vercel.app · **Login:** /login  
**Repo:** https://github.com/felipemadrida/SocialHub--FM-  
**DB:** PostgreSQL en Neon (`SocialHub-FM`) · **Versión:** 0.6.4

Guía corta del paquete: ver [`PACKAGE.md`](./PACKAGE.md).

---

## Qué incluye (v0.6+)

| Módulo | Descripción |
|--------|-------------|
| **Cuentas OAuth** | Login real por red → publicar a una o varias a la vez |
| **Studio Creativo** | Biblioteca de medios, upload, adjuntar a posts |
| **Marketing Hub** | Campañas y branding |
| **IA Studio** | Generación de copy |
| **Despliegue** | Guía interactiva + config de producción |
| **Auth** | NextAuth credentials (Admin / Retail) |

---

## Requisitos

- **Node.js** 18+
- PostgreSQL (Neon, Supabase o Docker local)

---

## Instalación rápida

```bash
npm install
cp .env.example .env
# Edita DATABASE_URL, NEXTAUTH_SECRET, APP_URL / NEXTAUTH_URL

# Postgres local (opcional):
# docker compose up -d
# DATABASE_URL="postgresql://socialhub:socialhub@localhost:5432/socialhub?schema=public"

npm run db:push
npm run dev
# → http://localhost:3001/login
```

### Acceso inicial

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `admin@socialhub.local` | `Admin123!` |
| Retail | `retail@socialhub.local` | `Retail123!` |

Cambia estas claves en producción (`ADMIN_*` / `RETAIL_*`).

- **Admin:** Config, seed, usuarios, Admin
- **Retail:** contenido, agenda, marketing, IA
- **Redes:** Cuentas → Login OAuth

---

## OAuth (obligatorio para publicar)

Callbacks (`APP_URL`):

```
{APP_URL}/api/oauth/facebook/callback
{APP_URL}/api/oauth/instagram/callback
{APP_URL}/api/oauth/tiktok/callback
{APP_URL}/api/oauth/x/callback
{APP_URL}/api/oauth/linkedin/callback
{APP_URL}/api/oauth/youtube/callback
{APP_URL}/api/oauth/pinterest/callback
```

Variables: `META_*`, `X_*`, `LINKEDIN_*`, `TIKTOK_*`, `GOOGLE_*`, `PINTEREST_*` (ver `.env.example`).

Live: Facebook, Instagram, X, LinkedIn.

---

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | App en **3001** |
| `npm run build` / `start` | Producción local |
| `npm run db:push` | Schema Prisma |
| `npm run purge:demo` | Limpia cuentas placeholder/`demo_*` |
| `npm run setup` | install + generate + db:push |
| `npm run dev:automation` | Sidecar agenda (**3031**) |

---

## Despliegue

1. GitHub + Vercel (proyecto `socialhub-fm`)
2. Env: `DATABASE_URL`, `NEXTAUTH_*`, `APP_URL`, OAuth keys
3. `ALLOW_SEED=false` en prod
4. Guía: pestaña **Despliegue** en la app

---

## Licencia

Uso privado / educativo — SocialHub -FM-.
