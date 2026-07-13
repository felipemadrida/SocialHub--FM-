"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Database,
  ExternalLink,
  GitBranch,
  Globe,
  Rocket,
  Server,
  Terminal,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const GITIGNORE = `# dependencies
node_modules/
.pnp
.pnp.js

# env
.env
.env*.local

# next
.next/
out/
build/
dist/

# db / prisma
db/*.db
db/*.db-journal
prisma/*.db
*.db-journal

# misc
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.vercel
*.tsbuildinfo
next-env.d.ts
`;

const ENV_TEMPLATE = `# Database PostgreSQL (Neon / Supabase / Render)
DATABASE_URL="postgresql://USER:PASS@HOST/DB?sslmode=require"

# Auth
NEXTAUTH_URL="https://tu-dominio.vercel.app"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
ADMIN_EMAIL="admin@tudominio.com"
ADMIN_PASSWORD="cambia-esta-clave"
RETAIL_EMAIL="retail@tudominio.com"
RETAIL_PASSWORD="cambia-esta-clave"

# App
APP_URL="https://tu-dominio.vercel.app"
ALLOW_SEED="false"
SEED_SECRET=""
# OPENAI_API_KEY=
`;

const GIT_COMMANDS = `git init
git add .
git commit -m "SocialHub -FM- initial commit"
git branch -M main
git remote add origin https://github.com/felipemadrida/SocialHub--FM-.git
git push -u origin main

# GitLab (alternativa):
# git remote add origin https://gitlab.com/TU-USUARIO/socialhub-app.git
# git push -u origin main`;

const QUICK_DEPLOY = `git init
git add .
git commit -m "SocialHub -FM- Initial commit"
git remote add origin https://github.com/felipemadrida/SocialHub--FM-.git
git push -u origin main
# Luego: vercel.com → Add New Project → selecciona el repo → Deploy`;

const CHECKLIST = [
  "Código en GitHub o GitLab (rama main)",
  ".gitignore incluye .env, node_modules, .next, *.db",
  "NEXTAUTH_SECRET generado (openssl rand -base64 32)",
  "DATABASE_URL cloud configurada (Neon/Supabase/…)",
  "Variables en Vercel: DATABASE_URL, NEXTAUTH_*, APP_URL",
  "ALLOW_SEED=false en producción",
  "Usuarios admin/retail con contraseñas fuertes",
  "Dominio personalizado + DNS apuntando a Vercel",
];

const PLATFORMS = [
  {
    name: "Vercel",
    badge: "Recomendado",
    icon: "▲",
    points: "100% gratis en hobby · deploy automático desde GitHub · Next.js nativo",
    url: "https://vercel.com/new",
  },
  {
    name: "Netlify",
    badge: "Gratis",
    icon: "N",
    points: "100GB bandwidth gratis · SSL automático · buena DX",
    url: "https://app.netlify.com/start",
  },
  {
    name: "Render",
    badge: "Postgres",
    icon: "R",
    points: "PostgreSQL gratis · Next.js nativo · sleep en free tier",
    url: "https://dashboard.render.com/",
  },
  {
    name: "Railway",
    badge: "$5/mes",
    icon: "⚡",
    points: "$5 crédito/mes · deploy con 1 clic · DB incluida",
    url: "https://railway.app/",
  },
];

const DB_OPTIONS = [
  {
    name: "Neon",
    desc: "Postgres serverless · branch de DB · ideal Vercel",
    url: "https://console.neon.tech/",
    sample: 'DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"',
  },
  {
    name: "Supabase",
    desc: "Postgres + Auth + Storage · free tier generoso",
    url: "https://supabase.com/dashboard",
    sample: 'DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"',
  },
  {
    name: "Turso",
    desc: "SQLite edge (libSQL) · muy barato / gratis",
    url: "https://turso.tech/",
    sample: 'DATABASE_URL="libsql://your-db.turso.io?authToken=TOKEN"',
  },
  {
    name: "PlanetScale",
    desc: "MySQL serverless · branching de esquema",
    url: "https://app.planetscale.com/",
    sample: 'DATABASE_URL="mysql://user:pass@aws.connect.psdb.cloud/db?sslaccept=strict"',
  },
];

const VERCEL_STEPS = [
  {
    letter: "A",
    title: "Cuenta e import",
    body: "Entra a vercel.com → Add New Project → Importa el repositorio de GitHub/GitLab.",
  },
  {
    letter: "B",
    title: "Framework",
    body: "Framework Preset: Next.js. Root Directory: . (o socialhub-project si despliegas el paquete).",
  },
  {
    letter: "C",
    title: "Build",
    body: "Build Command: next build (o npm run build). Install: npm install. Output: automático.",
  },
  {
    letter: "D",
    title: "Variables",
    body: "Añade DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, ADMIN_*, RETAIL_*, APP_URL. ALLOW_SEED=false.",
  },
  {
    letter: "E",
    title: "Prisma en build",
    body: "En package.json asegúrate de que el build genere Prisma (prisma generate). En Vercel: postinstall opcional `prisma generate`.",
  },
  {
    letter: "F",
    title: "Deploy & verificar",
    body: "Deploy → abre la URL → /login con admin → revisa Dashboard y pestaña Despliegue.",
  },
];

function CopyButton({ text, label }: { text: string; label?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copiado", description: label || "Comandos en el portapapeles" });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button type="button" size="sm" variant="secondary" className="gap-1.5" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label || "Copiar"}
    </Button>
  );
}

function CodeBlock({ code, copyLabel }: { code: string; copyLabel?: string }) {
  return (
    <div className="relative rounded-lg border bg-muted/40">
      <div className="flex justify-end border-b px-2 py-1.5">
        <CopyButton text={code} label={copyLabel} />
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function DeployGuide() {
  const [checks, setChecks] = useState<boolean[]>(() => CHECKLIST.map(() => false));
  const done = useMemo(() => checks.filter(Boolean).length, [checks]);

  const toggle = (i: number) => {
    setChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Rocket className="h-5 w-5" />
                Guía de Despliegue · SocialHub -FM-
              </CardTitle>
              <CardDescription className="mt-1">
                Git → variables → Vercel → DB cloud → dominio. Checklist interactivo y comandos
                copiables.
              </CardDescription>
            </div>
            <Badge variant="secondary">
              Pre-deploy {done}/{CHECKLIST.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <CodeBlock code={QUICK_DEPLOY} copyLabel="Copiar deploy rápido" />
          <p className="mt-3 text-sm text-muted-foreground">
            Luego ve a{" "}
            <a
              className="text-foreground underline underline-offset-2"
              href="https://vercel.com/new"
              target="_blank"
              rel="noreferrer"
            >
              vercel.com
            </a>{" "}
            → Add New Project → selecciona tu repo → Deploy.
          </p>
        </CardContent>
      </Card>

      {/* Platforms */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORMS.map((p) => (
          <Card key={p.name} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>
                  <span className="mr-1.5 opacity-70">{p.icon}</span>
                  {p.name}
                </span>
                <Badge variant={p.badge === "Recomendado" ? "default" : "outline"}>{p.badge}</Badge>
              </CardTitle>
              <CardDescription className="text-xs leading-snug">{p.points}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild size="sm" variant="outline" className="w-full gap-1.5">
                <a href={p.url} target="_blank" rel="noreferrer">
                  Abrir <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checklist Pre-Deploy</CardTitle>
          <CardDescription>Haz clic para marcar / desmarcar cada ítem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {CHECKLIST.map((item, i) => (
            <button
              key={item}
              type="button"
              onClick={() => toggle(i)}
              className="flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition hover:bg-muted/50"
            >
              {checks[i] ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className={checks[i] ? "text-muted-foreground line-through" : ""}>{item}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Step 1 Git */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4" />
            1️⃣ Git Setup
          </CardTitle>
          <CardDescription>GitHub y GitLab + .gitignore + copiar comandos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock code={GIT_COMMANDS} copyLabel="Copiar Comandos Git" />
          <div>
            <p className="mb-2 text-sm font-medium">Archivo .gitignore recomendado</p>
            <CodeBlock code={GITIGNORE} copyLabel="Copiar .gitignore" />
          </div>
        </CardContent>
      </Card>

      {/* Step 2 Env */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="h-4 w-4" />
            2️⃣ Variables de Entorno
          </CardTitle>
          <CardDescription>
            Template .env con DATABASE_URL, NEXTAUTH_SECRET, usuarios seed, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock code={ENV_TEMPLATE} copyLabel="Copiar .env" />
          <p className="mt-2 text-xs text-muted-foreground">
            Generar secreto:{" "}
            <code className="rounded bg-muted px-1">openssl rand -base64 32</code>
          </p>
        </CardContent>
      </Card>

      {/* Step 3 Vercel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" />
            3️⃣ Deploy en Vercel (A→F)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {VERCEL_STEPS.map((s) => (
            <div key={s.letter} className="flex gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {s.letter}
              </div>
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Step 4 DB */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" />
            4️⃣ Base de Datos Cloud (gratis)
          </CardTitle>
          <CardDescription>Neon · Supabase · Turso · PlanetScale</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {DB_OPTIONS.map((db) => (
            <div key={db.name} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{db.name}</p>
                <Button asChild size="sm" variant="ghost" className="h-8 gap-1 px-2">
                  <a href={db.url} target="_blank" rel="noreferrer">
                    Abrir <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{db.desc}</p>
              <CodeBlock code={db.sample} copyLabel="Copiar URL" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Step 5 Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            5️⃣ Dominio Personalizado
          </CardTitle>
          <CardDescription>Gratis / barato + DNS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Gratis / barato:</strong> Freenom (limitado),
            DuckDNS, Freenom alternativas, Namecheap / Porkbun (~$1–10/año), Cloudflare Registrar.
          </p>
          <Separator />
          <ol className="list-decimal space-y-2 pl-5">
            <li>Vercel → Project → Settings → Domains → añade tu dominio.</li>
            <li>
              En el DNS del registrar crea un registro{" "}
              <code className="rounded bg-muted px-1">A</code> a{" "}
              <code className="rounded bg-muted px-1">76.76.21.21</code> (o los CNAME que indique
              Vercel).
            </li>
            <li>
              Actualiza <code className="rounded bg-muted px-1">NEXTAUTH_URL</code> y{" "}
              <code className="rounded bg-muted px-1">APP_URL</code> al dominio final y redeploy.
            </li>
            <li>
              <strong className="text-foreground">Prisma:</strong> el schema ya usa{" "}
              <code className="rounded bg-muted px-1">provider = &quot;postgresql&quot;</code>. Pon tu{" "}
              <code className="rounded bg-muted px-1">DATABASE_URL</code> de Neon/Supabase y ejecuta{" "}
              <code className="rounded bg-muted px-1">npx prisma db push</code>.
            </li>
            <li>SSL lo provisiona Vercel automáticamente (HTTPS).</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
