"use client";

import { FormEvent, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Loader2, Shield, Store } from "lucide-react";
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
    <Card className="w-full max-w-md border-white/10 bg-card/90 backdrop-blur">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">SocialHub -FM-</CardTitle>
            <CardDescription>Acceso seguro · Admin & Retail</CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" /> Admin
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Store className="h-3 w-3" /> Retail
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Demo: admin@socialhub.local / Admin123! · retail@socialhub.local / Retail123!
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(120,120,120,0.25),_transparent_55%),linear-gradient(160deg,#0a0a0a_0%,#171717_45%,#262626_100%)] dark:opacity-100 opacity-90" />
      <div className="relative z-10 w-full flex justify-center">
        <Suspense
          fallback={
            <div className="text-muted-foreground flex items-center gap-2">
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
