# SocialHub -FM- · Pack de diseño y gráficos

Paleta: **teal `#14b8a6` → violet `#8b5cf6`** · fondo hero **navy `#0f172a`**.

## Carpetas

| Ruta | Contenido |
|------|-----------|
| `public/brand/` | Logo, favicon, banner, hero, promo (PNG marca) |
| `public/marketing/` | Hero, scheduler, automation, campaign (PNG + SVG) |
| `public/marketing/generated/` | Variantes promo (IG / TikTok / AI / hero) |
| `public/design/` | Pack rápido: logo, banner, hero, preview, meta-icon |
| `public/meta-icon-1024.jpg` | Ícono Meta App Review 1024×1024 |

## Archivos clave

```
public/brand/socialhub_logo.png
public/brand/socialhub_favicon.png
public/brand/socialhub_banner.png
public/brand/socialhub_hero_bg.png
public/brand/socialhub_promo.png
public/marketing/hero-banner.png|.svg
public/marketing/scheduler-preview.png|.svg
public/marketing/automation-preview.png|.svg
public/marketing/campaign-launch.png|.svg
public/marketing/app-logo.png|.svg
public/design/*  (copias listas para compartir)
```

## UI

- Galería: pestaña **Marketing** → Brand gallery (`BrandGallery`)
- Tokens CSS: `src/app/globals.css` + clase `brand-gradient-btn`
- Constantes: `src/lib/brand.ts` (`BRAND`, `BRAND_ASSETS`)

## Uso Meta / OAuth

- Ícono app: `public/meta-icon-1024.jpg` o `public/design/meta-icon-1024.jpg`
- Privacidad: `/privacy`
