# SocialHub -FM- — Paquete completo (v0.6.7)

Copia distribuible alineada con producción (`socialhub-fm.vercel.app`).

## Incluye
| **Dise�o / gr�ficos** | OK � ver ASSETS.md (public/brand, marketing, design) |

| Módulo | Estado |
|--------|--------|
| Auth Admin / Retail | OK |
| OAuth multi-red (Meta scopes seguros + App Review ready) | OK |
| Publicación paralela live | OK |
| `/privacy` pública (Meta App Review) | OK |
| Íconos Meta 1024 (`/meta-icon-1024.jpg`) | OK |
| Studio Creativo | OK |
| Marketing Hub + IA | OK |
| Guía Despliegue | OK |
| Sidecar automation | OK |

## Setup

```bash
cd socialhub-project
cp .env.example .env
# DATABASE_URL, NEXTAUTH_SECRET, APP_URL, NEXTAUTH_URL
# META_APP_ID / META_APP_SECRET para Facebook

npm run setup
npm run dev
# http://localhost:3001/login
```

### Meta / Facebook

1. Dominios de la app: `socialhub-fm.vercel.app` (o localhost)
2. Callbacks: `{APP_URL}/api/oauth/facebook/callback`
3. Ícono: `public/meta-icon-1024.jpg`
4. Privacidad: `{APP_URL}/privacy`
5. Para publicar Pages: activa `pages_manage_posts` en Meta → Permisos, luego:
   ```
   META_FACEBOOK_SCOPES=public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_engagement
   ```

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run setup` | install + prisma generate + db push |
| `npm run dev` | puerto **3001** |
| `npm run purge:demo` | limpia cuentas placeholder |
| `npm run dev:automation` | sidecar **3031** |

Live: https://socialhub-fm.vercel.app
