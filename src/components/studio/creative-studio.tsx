"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FolderOpen,
  Grid3X3,
  Heart,
  ImageIcon,
  LayoutList,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  Video,
  FileText,
  Palette,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  STUDIO_CATEGORIES,
  STUDIO_CATEGORY_LABELS,
  STUDIO_TYPE_LABELS,
  STUDIO_TYPES,
  type StudioAssetDTO,
  type StudioCategory,
  type StudioType,
} from "@/lib/studio";

type Props = {
  toast: (o: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
};

const TYPE_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "image", label: "Imágenes" },
  { id: "video", label: "Videos" },
  { id: "design", label: "Diseños" },
  { id: "document", label: "Docs" },
  { id: "favorites", label: "Favoritos" },
];

function TypeIcon({ type }: { type: string }) {
  if (type === "video") return <Video className="h-4 w-4" />;
  if (type === "design") return <Palette className="h-4 w-4" />;
  if (type === "document") return <FileText className="h-4 w-4" />;
  return <ImageIcon className="h-4 w-4" />;
}

function isVisual(type: string, url: string) {
  if (type === "image" || type === "design") return true;
  return /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(url);
}

function formatBytes(n: number) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function CreativeStudio({ toast }: Props) {
  const [assets, setAssets] = useState<StudioAssetDTO[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [q, setQ] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<StudioAssetDTO | null>(null);
  const [editing, setEditing] = useState<StudioAssetDTO | null>(null);
  const [saving, setSaving] = useState(false);

  // upload form
  const [file, setFile] = useState<File | null>(null);
  const [extUrl, setExtUrl] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<StudioCategory>("marca");
  const [type, setType] = useState<StudioType | "auto">("auto");
  const [collection, setCollection] = useState("");
  const [tags, setTags] = useState("");
  const [altText, setAltText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (collectionFilter !== "all") params.set("collection", collectionFilter);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/studio/media?${params.toString()}`);
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setAssets(data.assets || []);
      setCollections(data.collections || []);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cargar el Studio",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter, collectionFilter, q, toast]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const stats = useMemo(() => {
    return {
      total: assets.length,
      favorites: assets.filter((a) => a.isFavorite).length,
      collections: collections.length,
    };
  }, [assets, collections]);

  const resetUpload = () => {
    setFile(null);
    setExtUrl("");
    setName("");
    setCategory("marca");
    setType("auto");
    setCollection("");
    setTags("");
    setAltText("");
  };

  const upload = async () => {
    if (!file && !extUrl.trim()) {
      toast({
        title: "Falta archivo o URL",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      if (file) form.append("file", file);
      if (extUrl.trim()) form.append("url", extUrl.trim());
      form.append("name", name || file?.name || "Asset");
      form.append("category", category);
      if (type !== "auto") form.append("type", type);
      if (collection.trim()) form.append("collection", collection.trim());
      form.append("tags", tags);
      if (altText.trim()) form.append("altText", altText.trim());

      const res = await fetch("/api/studio/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "upload failed");
      toast({ title: "Asset subido", description: data.name });
      setUploadOpen(false);
      resetUpload();
      await load();
    } catch (e) {
      toast({
        title: "Error al subir",
        description: e instanceof Error ? e.message : "Falló",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = async (asset: StudioAssetDTO) => {
    const res = await fetch("/api/studio/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: asset.id, isFavorite: !asset.isFavorite }),
    });
    if (!res.ok) {
      toast({ title: "No se pudo actualizar favorito", variant: "destructive" });
      return;
    }
    await load();
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/studio/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          name: editing.name,
          category: editing.category,
          collection: editing.collection,
          tags: editing.tags,
          altText: editing.altText,
          type: editing.type,
        }),
      });
      if (!res.ok) throw new Error("edit failed");
      toast({ title: "Asset actualizado" });
      setEditing(null);
      await load();
    } catch {
      toast({ title: "Error al editar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/studio/media?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast({ title: "No se pudo eliminar", variant: "destructive" });
      return;
    }
    toast({ title: "Asset eliminado" });
    setPreview(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-violet-500/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FolderOpen className="h-5 w-5 text-teal-500" />
                Studio Creativo
              </CardTitle>
              <CardDescription className="mt-1">
                Sube y gestiona diseños, fotos, videos y documentos — sin depender de IA
              </CardDescription>
            </div>
            <Button className="brand-gradient-btn gap-2" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" />
              Subir archivo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <Badge variant="secondary">{stats.total} assets</Badge>
          <Badge variant="outline" className="gap-1">
            <Star className="h-3 w-3 text-amber-400" /> {stats.favorites} favoritos
          </Badge>
          <Badge variant="outline">{stats.collections} colecciones</Badge>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={typeFilter === f.id ? "default" : "outline"}
              className={typeFilter === f.id ? "brand-gradient-btn" : ""}
              onClick={() => setTypeFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar nombre, tags, alt…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {STUDIO_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {STUDIO_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={collectionFilter} onValueChange={setCollectionFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Colección" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {collections.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex rounded-md border p-0.5">
            <Button
              size="icon"
              variant={view === "grid" ? "secondary" : "ghost"}
              className="h-8 w-8"
              onClick={() => setView("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={view === "list" ? "secondary" : "ghost"}
              className="h-8 w-8"
              onClick={() => setView("list")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Collections chips */}
      {collections.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={collectionFilter === "all" ? "default" : "outline"}
            onClick={() => setCollectionFilter("all")}
          >
            Todas las colecciones
          </Button>
          {collections.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={collectionFilter === c ? "default" : "outline"}
              onClick={() => setCollectionFilter(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando Studio…
        </div>
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderOpen className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">Sin assets</p>
            <p className="mt-1 text-sm">Sube tu primer archivo al Studio Creativo</p>
            <Button className="brand-gradient-btn mt-4 gap-2" onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4" /> Subir
            </Button>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group overflow-hidden rounded-xl border bg-card transition hover:border-teal-500/40"
            >
              <button
                type="button"
                className="relative aspect-video w-full bg-[#0f172a]"
                onClick={() => setPreview(asset)}
              >
                {isVisual(asset.type, asset.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.url}
                    alt={asset.altText || asset.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <TypeIcon type={asset.type} />
                  </div>
                )}
                <div className="absolute left-2 top-2 flex gap-1">
                  <Badge className="bg-black/60 text-[10px] text-white hover:bg-black/60">
                    {STUDIO_TYPE_LABELS[asset.type as StudioType] || asset.type}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {STUDIO_CATEGORY_LABELS[asset.category as StudioCategory] ||
                      asset.category}
                  </Badge>
                </div>
                {asset.isFavorite && (
                  <Star className="absolute right-2 top-2 h-4 w-4 fill-amber-400 text-amber-400" />
                )}
              </button>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-semibold">{asset.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {asset.collection || "Sin colección"}
                </p>
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => toggleFavorite(asset)}
                  >
                    <Heart
                      className={`h-4 w-4 ${asset.isFavorite ? "fill-amber-400 text-amber-400" : ""}`}
                    />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setEditing(asset)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => remove(asset.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => setPreview(asset)}
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {isVisual(asset.type, asset.url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <TypeIcon type={asset.type} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{asset.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {STUDIO_TYPE_LABELS[asset.type as StudioType] || asset.type} ·{" "}
                      {asset.collection || "—"} · {formatBytes(asset.sizeBytes)}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => toggleFavorite(asset)}>
                    <Star
                      className={`h-4 w-4 ${asset.isFavorite ? "fill-amber-400 text-amber-400" : ""}`}
                    />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(asset)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => remove(asset.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upload dialog */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) resetUpload();
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Subir al Studio
            </DialogTitle>
            <DialogDescription>
              Archivo local o URL externa · imágenes, videos, diseños, documentos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Archivo</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>URL externa (opcional)</Label>
              <Input
                placeholder="https://… o /ruta/local"
                value={extUrl}
                onChange={(e) => setExtUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Logo Q3" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as StudioCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDIO_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {STUDIO_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as StudioType | "auto")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    {STUDIO_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {STUDIO_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Colección</Label>
              <Input
                list="studio-collections"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                placeholder="Identidad de Marca"
              />
              <datalist id="studio-collections">
                {collections.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Tags (coma)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="logo, launch, q3"
              />
            </div>
            <div className="space-y-2">
              <Label>Alt text</Label>
              <Textarea
                rows={2}
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancelar
            </Button>
            <Button className="brand-gradient-btn gap-2" onClick={upload} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Subir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TypeIcon type={preview.type} />
                  {preview.name}
                </DialogTitle>
                <DialogDescription>
                  {preview.collection || "Sin colección"} ·{" "}
                  {STUDIO_CATEGORY_LABELS[preview.category as StudioCategory] ||
                    preview.category}
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-hidden rounded-lg border bg-[#0f172a]">
                {preview.type === "video" ? (
                  <video src={preview.url} controls className="max-h-[420px] w-full" />
                ) : isVisual(preview.type, preview.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.url}
                    alt={preview.altText || preview.name}
                    className="max-h-[420px] w-full object-contain"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center text-slate-400">
                    <a href={preview.url} target="_blank" rel="noreferrer" className="underline">
                      Abrir documento
                    </a>
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Alt:</span>{" "}
                  {preview.altText || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">URL:</span>{" "}
                  <code className="rounded bg-muted px-1 text-xs">{preview.url}</code>
                </p>
                <p>
                  <span className="text-muted-foreground">Tamaño:</span>{" "}
                  {formatBytes(preview.sizeBytes)}
                </p>
                <div className="flex flex-wrap gap-1">
                  {preview.tags.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => toggleFavorite(preview)}>
                  <Star
                    className={`mr-2 h-4 w-4 ${preview.isFavorite ? "fill-amber-400 text-amber-400" : ""}`}
                  />
                  Favorito
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(preview);
                    setPreview(null);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </Button>
                <Button variant="destructive" onClick={() => remove(preview.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>Editar asset</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={editing.category}
                      onValueChange={(v) => setEditing({ ...editing, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STUDIO_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {STUDIO_CATEGORY_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={editing.type}
                      onValueChange={(v) =>
                        setEditing({ ...editing, type: v as StudioType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STUDIO_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {STUDIO_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Colección</Label>
                  <Input
                    value={editing.collection || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, collection: e.target.value || null })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (coma)</Label>
                  <Input
                    value={editing.tags.join(", ")}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        tags: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alt text</Label>
                  <Textarea
                    rows={2}
                    value={editing.altText || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, altText: e.target.value || null })
                    }
                    className="resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <Button className="brand-gradient-btn" onClick={saveEdit} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Compact picker for create-post dialog */
export function StudioAssetPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (urls: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<StudioAssetDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch("/api/studio/media?type=image").then((r) => r.json()),
      fetch("/api/studio/media?type=design").then((r) => r.json()),
    ])
      .then(([images, designs]) => {
        const map = new Map<string, StudioAssetDTO>();
        for (const a of [...(images.assets || []), ...(designs.assets || [])]) {
          map.set(a.id, a);
        }
        setAssets([...map.values()]);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const toggle = (url: string) => {
    onChange(
      selected.includes(url)
        ? selected.filter((u) => u !== url)
        : [...selected, url]
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Adjuntar del Studio</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setOpen((v) => !v)}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          {open ? "Ocultar" : "Elegir imágenes"}
        </Button>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((url) => (
            <div key={url} className="relative h-16 w-16 overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                onClick={() => onChange(selected.filter((u) => u !== url))}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="max-h-48 overflow-y-auto rounded-lg border p-2">
          {loading ? (
            <p className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Cargando…
            </p>
          ) : assets.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">No hay imágenes en el Studio</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {assets.map((a) => {
                const on = selected.includes(a.url);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggle(a.url)}
                    className={`relative aspect-square overflow-hidden rounded-md border ${
                      on ? "ring-2 ring-teal-500" : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
                    {on && (
                      <span className="absolute inset-0 flex items-center justify-center bg-teal-500/30 text-lg font-bold text-white">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      <Separator className="opacity-0" />
    </div>
  );
}
