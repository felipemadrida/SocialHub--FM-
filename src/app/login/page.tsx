"use client";

import { FormEvent, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Shield, Store } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("admin@socialhub.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Credenciales inválidas o usuario inactivo.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md border-white/10 bg-[#0f172a]/85 text-white backdrop-blur">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/socialhub_logo.png"
            alt="SocialHub"
            width={44}
            height={44}
            className="rounded-lg ring-1 ring-white/15"
          />
          <div>
            <CardTitle className="brand-gradient-text text-xl">SocialHub -FM-</CardTitle>
            <CardDescription className="text-slate-400">Acceso seguro · Admin & Retail</CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" /> Admin
          </Badge>
          <Badge variant="outline" className="gap-1 border-white/20 text-slate-200">
            <Store className="h-3 w-3" /> Retail
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-white/15 bg-white/5 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-white/15 bg-white/5 text-white"
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : (
            <p className="text-xs text-slate-400">
              Demo: admin@socialhub.local / Admin123! · retail@socialhub.local / Retail123!
            </p>
          )}
          <Button type="submit" className="brand-gradient-btn w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar sesión"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/socialhub_hero_bg.png"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0f172a]/70" />
      </div>
      <div className="brand-top-line absolute inset-x-0 top-0 z-20" />
      <div className="relative z-10 flex w-full justify-center">
        <Suspense
          fallback={
            <div className="flex items-center gap-2 text-slate-300">
              <Loader2 className="h-5 w-5 animate-spin" /> Cargando…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
