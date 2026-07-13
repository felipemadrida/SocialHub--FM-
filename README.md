# SocialHub -FM-

Dashboard en español para gestionar cuentas, contenido, agenda y automatización en **Facebook**, **Instagram**, **TikTok**, **X**, **LinkedIn**, **YouTube** y **Pinterest**.

> Incluye **Marketing Hub**, **IA Studio**, identidad de marca teal→violet, pestaña **Despliegue** (config real) y seguridad **Admin / Retail**. Tema **Blanco | Negro**. Publicación simulada por defecto (`mockPublish`).

**Web (producción):** https://socialhub-fm.vercel.app  
**Login:** https://socialhub-fm.vercel.app/login  
**Repo:** https://github.com/felipemadrida/SocialHub--FM-  
**DB:** PostgreSQL en Neon (`SocialHub-FM`)

---

## Requisitos

- **Node.js** 18+ (recomendado) o **Bun** 1.0+
- **npm**, **yarn** o **bun**

---

## Instalación rápida

```bash
# 1. Entrar al directorio del proyecto
cd socialhub

# 2. Instalar dependencias
npm install

# 3. Variables de entorno
cp .env.example .env
# DATABASE_URL = PostgreSQL (Neon / Supabase / docker compose)
# También: NEXTAUTH_*, ADMIN_*, RETAIL_*, ALLOW_SEED, SEED_SECRET

# 3b. (Opcional) Postgres local con Docker
# docker compose up -d
# DATABASE_URL="postgresql://socialhub:socialhub@localhost:5432/socialhub?schema=public"

# 4. Generar Prisma Client y sincronizar BD
npm run db:push

# 5. Servidor de desarrollo
npm run dev
# App: http://localhost:3001 → redirige a /login

# 6. (Opcional) servicio de automatización mock
npm run dev:automation
```

### Acceso (usuarios iniciales)

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `admin@socialhub.local` | `Admin123!` |
| Retail | `retail@socialhub.local` | `Retail123!` |

- **Admin:** escritura en Config, seed, usuarios, borrados críticos, pestaña Admin
- **Retail:** operación diaria (contenido, agenda, marketing, IA)
- **Redes:** Cuentas → Login OAuth (requiere `META_*`, `X_*`, etc. en el entorno)
- Guía de deploy: pestaña **Despliegue**

---

## Estructura del proyecto

```
socialhub/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Dashboard (tabs)
│   │   ├── login/page.tsx           # Login Admin/Retail
│   │   ├── layout.tsx               # Layout + SessionProvider + tema
│   │   ├── globals.css
│   │   └── api/
│   │       ├── auth/[...nextauth]/  # NextAuth credentials
│   │       ├── users/               # CRUD usuarios (admin)
│   │       ├── accounts/, posts/, …
│   │       ├── campaigns/, ai/, settings/, seed/
│   ├── middleware.ts                # Auth JWT + roles en APIs
│   ├── components/
│   │   ├── deploy/deploy-guide.tsx  # Guía Despliegue interactiva
│   │   ├── admin/                   # Panel usuarios
│   │   ├── marketing/, settings/, ui/
│   ├── lib/
│   │   ├── auth.ts, api-auth.ts, ensure-users.ts
│   │   ├── platforms.ts, …
```

---

## Despliegue (resumen)

1. GitHub/GitLab + `.gitignore`
2. Variables: `DATABASE_URL` cloud, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
3. Vercel A→F (ver pestaña **Despliegue** en la app)
4. DB: Neon / Supabase (Prisma ya está en `postgresql`)
5. Dominio + DNS

Comparativa: Vercel (recomendado), Netlify, Render, Railway.

---

## Personalización

Usa la pestaña **Config** (no edites `page.tsx` a mano): marca, plataformas, agenda, automatización.

---

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Next.js en puerto **3001** |
| `npm run build` / `start` | Producción local |
| `npm run db:push` | Sincroniza schema Prisma |
| `npm run dev:automation` | Mock publish en **3031** |

---

## Licencia

Uso privado / educativo del proyecto SocialHub -FM-.
