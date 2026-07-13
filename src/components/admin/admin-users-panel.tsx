"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Shield, Store, Trash2, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type AppUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "retail";
  isActive: boolean;
  createdAt: string;
};

export function AdminUsersPanel() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "retail">("retail");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("No autorizado");
      const data = await res.json();
      setUsers(data);
    } catch {
      toast({
        title: "Error",
        description: "Solo administradores pueden gestionar usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const createUser = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear");
      toast({ title: "Usuario creado", description: email });
      setName("");
      setEmail("");
      setPassword("");
      setRole("retail");
      await load();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo crear",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: AppUser) => {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast({ title: "Error", description: data.error || "Falló", variant: "destructive" });
      return;
    }
    await load();
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast({ title: "Error", description: data.error || "Falló", variant: "destructive" });
      return;
    }
    toast({ title: "Usuario eliminado" });
    await load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Seguridad · Usuarios Admin & Retail
          </CardTitle>
          <CardDescription>
            Admin: configuración, seed, usuarios y borrados críticos. Retail: operación diaria
            (contenido, agenda, marketing, IA).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Pérez" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana@tienda.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mín. 8 caracteres"
            />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "retail")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button onClick={createUser} disabled={saving || !name || !email || password.length < 8}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Crear usuario
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuarios registrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin usuarios</p>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{u.name}</p>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"} className="gap-1">
                      {u.role === "admin" ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <Store className="h-3 w-3" />
                      )}
                      {u.role}
                    </Badge>
                    <Badge variant={u.isActive ? "outline" : "destructive"}>
                      {u.isActive ? "activo" : "inactivo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(u)}>
                    {u.isActive ? (
                      <UserX className="h-4 w-4" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(u.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
