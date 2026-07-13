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
  Link2,
  Rocket,
  Server,
  Terminal,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

/** Configuración real en producción (sin secretos). */
const LIVE = {
  appUrl: "https://socialhub-fm.vercel.app",
  appAlias: "https://socialhub-fm-felipemadridas-projects.vercel.app",
  loginUrl: "https://socialhub-fm.vercel.app/login",
  github: "https://github.com/felipemadrida/SocialHub--FM-",
  githubGit: "https://github.com/felipemadrida/SocialHub--FM-.git",
  branch: "main",
  vercelProject: "socialhub-fm",
  vercelTeam: "felipemadridas-projects",
  vercelDashboard: "https://vercel.com/felipemadridas-projects/socialhub-fm",
  neonProject: "SocialHub-FM",
  neonProjectId: "shy-base-75226090",
  neonBranch: "main",
  neonDb: "neondb",
  neonHost: "ep-little-water-ajo74os1-pooler.c-3.us-east-2.aws.neon.tech",
  neonRegion: "us-east-2 (AWS)",
  neonConsole: "https://console.neon.tech/app/projects/shy-base-75226090",
  prismaProvider: "postgresql",
  framework: "Next.js 16 · App Router",
  node: "24.x (Vercel)",
  auth: "NextAuth credentials · roles admin / retail",
  envVars: [
    "DATABASE_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "APP_URL",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "RETAIL_EMAIL",
    "RETAIL_PASSWORD",
    "ALLOW_SEED",
    "SEED_SECRET",
  ],
} as const;

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

const ENV_TEMPLATE = `# ── Producción real (SocialHub -FM-) ──
# DATABASE_URL está en Vercel (Encrypted) → Neon neondb
# Host: ep-little-water-ajo74os1-pooler.c-3.us-east-2.aws.neon.tech
DATABASE_URL="postgresql://neondb_owner:***@ep-little-water-ajo74os1-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require"

NEXTAUTH_URL="https://socialhub-fm.vercel.app"
APP_URL="https://socialhub-fm.vercel.app"
NEXTAUTH_SECRET="(Encrypted en Vercel)"

ADMIN_EMAIL="admin@socialhub.local"
RETAIL_EMAIL="retail@socialhub.local"
ALLOW_SEED="false"
SEED_SECRET=""
# OPENAI_API_KEY=
`;

const GIT_COMMANDS = `git remote add origin https://github.com/felipemadrida/SocialHub--FM-.git
git branch -M main
git push -u origin main

# Estado actual: repo ya enlazado y en producción`;

const QUICK_DEPLOY = `# Ya desplegado — actualizar producción:
git add .
git commit -m "update"
git push origin main
# Vercel redeploy automático desde GitHub (proyecto socialhub-fm)

# URL: https://socialhub-fm.vercel.app`;

const CHECKLIST = [
  { label: "Código en GitHub (rama main)", done: true },
  { label: ".gitignore incluye .env, node_modules, .next, *.db", done: true },
  { label: "NEXTAUTH_SECRET en Vercel (Encrypted)", done: true },
  { label: "DATABASE_URL Neon (PostgreSQL) en Vercel", done: true },
  { label: "Variables: DATABASE_URL, NEXTAUTH_*, APP_URL, ADMIN_*, RETAIL_*", done: true },
  { label: "ALLOW_SEED=false en producción", done: true },
  { label: "Usuarios admin/retail (cambiar claves de prueba en prod)", done: false },
  { label: "Dominio personalizado (opcional; ahora *.vercel.app)", done: false },
];

const PLATFORMS = [
  {
    name: "Vercel",
    badge: "En uso",
    icon: "▲",
    points: "Proyecto socialhub-fm · deploy auto desde GitHub · alias socialhub-fm.vercel.app",
    url: LIVE.vercelDashboard,
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
    desc: `EN USO · proyecto ${LIVE.neonProject} · DB ${LIVE.neonDb} · ${LIVE.neonRegion}`,
    url: LIVE.neonConsole,
    sample: `Host: ${LIVE.neonHost}\nDB: ${LIVE.neonDb} · branch: ${LIVE.neonBranch}\nPrisma: provider = "postgresql"`,
    active: true,
  },
  {
    name: "Supabase",
    desc: "Postgres + Auth + Storage · free tier generoso",
    url: "https://supabase.com/dashboard",
    sample: 'DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"',
    active: false,
  },
  {
    name: "Turso",
    desc: "SQLite edge (libSQL) · muy barato / gratis",
    url: "https://turso.tech/",
    sample: 'DATABASE_URL="libsql://your-db.turso.io?authToken=TOKEN"',
    active: false,
  },
  {
    name: "PlanetScale",
    desc: "MySQL serverless · branching de esquema",
    url: "https://app.planetscale.com/",
    sample: 'DATABASE_URL="mysql://user:pass@aws.connect.psdb.cloud/db?sslaccept=strict"',
    active: false,
  },
];

const VERCEL_STEPS = [
  {
    letter: "A",
    title: "Repo conectado",
    body: `GitHub ${LIVE.github} → proyecto Vercel ${LIVE.vercelProject} (team ${LIVE.vercelTeam}).`,
  },
  {
    letter: "B",
    title: "Framework",
    body: "Next.js · Root `.` · Build: `prisma generate && next build` (vercel.json).",
  },
  {
    letter: "C",
    title: "Install",
    body: "npm install + postinstall `prisma generate`.",
  },
  {
    letter: "D",
    title: "Variables (Production + Preview)",
    body: `${LIVE.envVars.join(", ")} — todas Encrypted en Vercel.`,
  },
  {
    letter: "E",
    title: "Base de datos",
    body: `Neon PostgreSQL · ${LIVE.neonHost} · schema Prisma postgresql.`,
  },
  {
    letter: "F",
    title: "URL en vivo",
    body: `${LIVE.appUrl} · login ${LIVE.loginUrl}`,
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

function LiveRow({
  label,
  value,
  href,
  mono,
}: {
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 rounded-lg border px-3 py-2.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground shrink-0">
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-2">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={`truncate text-sm text-foreground underline-offset-2 hover:underline ${mono ? "font-mono text-xs" : ""}`}
          >
            {value}
          </a>
        ) : (
          <span className={`truncate text-sm ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
        )}
        <CopyButton text={href || value} label="Copiar" />
      </div>
    </div>
  );
}

export function DeployGuide() {
  const [checks, setChecks] = useState<boolean[]>(() => CHECKLIST.map((c) => c.done));
  const done = useMemo(() => checks.filter(Boolean).length, [checks]);

  const toggle = (i: number) => {
    setChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  return (
    <div className="space-y-6">
      {/* Configuración Real Actual */}
      <Card className="overflow-hidden border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-violet-500/5 to-transparent">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link2 className="h-5 w-5 text-teal-500" />
                Configuración Real Actual
              </CardTitle>
              <CardDescription className="mt-1">
                Producción enlazada · GitHub + Vercel + Neon PostgreSQL · sin secretos en claro
              </CardDescription>
            </div>
            <Badge className="brand-gradient-btn border-0">Live</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <LiveRow label="App web" value={LIVE.appUrl} href={LIVE.appUrl} />
            <LiveRow label="Login" value={LIVE.loginUrl} href={LIVE.loginUrl} />
            <LiveRow label="Alias Vercel" value={LIVE.appAlias} href={LIVE.appAlias} mono />
            <LiveRow label="GitHub" value={LIVE.github} href={LIVE.github} />
            <LiveRow label="Rama" value={LIVE.branch} mono />
            <LiveRow
              label="Vercel proyecto"
              value={`${LIVE.vercelTeam}/${LIVE.vercelProject}`}
              href={LIVE.vercelDashboard}
            />
            <LiveRow
              label="Neon"
              value={`${LIVE.neonProject} · ${LIVE.neonDb} · ${LIVE.neonRegion}`}
              href={LIVE.neonConsole}
            />
            <LiveRow label="Neon host" value={LIVE.neonHost} mono />
            <LiveRow label="Prisma" value={`provider = "${LIVE.prismaProvider}"`} mono />
            <LiveRow label="Stack" value={`${LIVE.framework} · Node ${LIVE.node}`} />
            <LiveRow label="Auth" value={LIVE.auth} />
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Variables en Vercel (Production + Preview) · Encrypted
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LIVE.envVars.map((v) => (
                <Badge key={v} variant="secondary" className="font-mono text-[10px]">
                  {v}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm" className="brand-gradient-btn gap-1.5">
              <a href={LIVE.appUrl} target="_blank" rel="noreferrer">
                Abrir app <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <a href={LIVE.vercelDashboard} target="_blank" rel="noreferrer">
                Dashboard Vercel <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <a href={LIVE.neonConsole} target="_blank" rel="noreferrer">
                Consola Neon <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <a href={LIVE.github} target="_blank" rel="noreferrer">
                Repo GitHub <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Rocket className="h-5 w-5" />
                Guía de Despliegue · SocialHub -FM-
              </CardTitle>
              <CardDescription className="mt-1">
                Actualizar producción con git push · checklist y comandos copiables
              </CardDescription>
            </div>
            <Badge variant="secondary">
              Listo {done}/{CHECKLIST.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <CodeBlock code={QUICK_DEPLOY} copyLabel="Copiar update" />
          <p className="mt-3 text-sm text-muted-foreground">
            Producción:{" "}
            <a
              className="text-foreground underline underline-offset-2"
              href={LIVE.appUrl}
              target="_blank"
              rel="noreferrer"
            >
              {LIVE.appUrl}
            </a>
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORMS.map((p) => (
          <Card key={p.name} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>
                  <span className="mr-1.5 opacity-70">{p.icon}</span>
                  {p.name}
                </span>
                <Badge variant={p.badge === "En uso" ? "default" : "outline"}>{p.badge}</Badge>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checklist (estado real)</CardTitle>
          <CardDescription>Pre-marcado según el despliegue actual — clic para ajustar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {CHECKLIST.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onClick={() => toggle(i)}
              className="flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition hover:bg-muted/50"
            >
              {checks[i] ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className={checks[i] ? "text-muted-foreground line-through" : ""}>
                {item.label}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4" />
            1️⃣ Git Setup
          </CardTitle>
          <CardDescription>Repo real: felipemadrida/SocialHub--FM-</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock code={GIT_COMMANDS} copyLabel="Copiar Comandos Git" />
          <div>
            <p className="mb-2 text-sm font-medium">Archivo .gitignore</p>
            <CodeBlock code={GITIGNORE} copyLabel="Copiar .gitignore" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="h-4 w-4" />
            2️⃣ Variables de Entorno (producción)
          </CardTitle>
          <CardDescription>
            Valores reales de URL; secretos solo en Vercel Dashboard (Encrypted)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock code={ENV_TEMPLATE} copyLabel="Copiar plantilla" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" />
            3️⃣ Vercel (A→F) — estado actual
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
                <p className="text-sm text-muted-foreground break-all">{s.body}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" />
            4️⃣ Base de Datos Cloud
          </CardTitle>
          <CardDescription>Neon en uso · otras opciones de referencia</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {DB_OPTIONS.map((db) => (
            <div
              key={db.name}
              className={`space-y-2 rounded-lg border p-3 ${db.active ? "border-teal-500/40 bg-teal-500/5" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium flex items-center gap-2">
                  {db.name}
                  {db.active && <Badge className="text-[10px]">Activo</Badge>}
                </p>
                <Button asChild size="sm" variant="ghost" className="h-8 gap-1 px-2">
                  <a href={db.url} target="_blank" rel="noreferrer">
                    Abrir <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{db.desc}</p>
              <CodeBlock code={db.sample} copyLabel="Copiar" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            5️⃣ Dominio
          </CardTitle>
          <CardDescription>Actual: alias Vercel · DNS personalizado opcional</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">En uso:</strong>{" "}
            <a href={LIVE.appUrl} className="underline underline-offset-2" target="_blank" rel="noreferrer">
              {LIVE.appUrl}
            </a>{" "}
            (SSL automático).
          </p>
          <Separator />
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Dominio propio: Vercel →{" "}
              <a href={`${LIVE.vercelDashboard}/settings/domains`} className="underline" target="_blank" rel="noreferrer">
                Settings → Domains
              </a>
              .
            </li>
            <li>
              DNS: registro <code className="rounded bg-muted px-1">A</code> a{" "}
              <code className="rounded bg-muted px-1">76.76.21.21</code> (o CNAME que indique Vercel).
            </li>
            <li>
              Actualiza <code className="rounded bg-muted px-1">NEXTAUTH_URL</code> y{" "}
              <code className="rounded bg-muted px-1">APP_URL</code> al dominio final y redeploy.
            </li>
            <li>
              Prisma ya usa <code className="rounded bg-muted px-1">provider = &quot;postgresql&quot;</code> contra Neon.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
