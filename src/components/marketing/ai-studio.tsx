"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONTENT_TYPES,
  CONTENT_TYPE_LABELS,
  IMAGE_SIZES,
  IMAGE_SIZE_LABELS,
  IMAGE_TEMPLATES,
  IMAGE_TEMPLATE_LABELS,
  TONES,
  TONE_LABELS,
} from "@/lib/marketing";
import { PLATFORM_CONFIG } from "@/lib/platforms";

type Props = {
  enabledPlatforms: string[];
  toast: (o: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  onUseAsPost?: (content: string) => void;
};

export function AiStudio({ enabledPlatforms, toast, onUseAsPost }: Props) {
  const [type, setType] = useState<string>("post");
  const [platform, setPlatform] = useState(enabledPlatforms[0] || "instagram");
  const [tone, setTone] = useState("profesional");
  const [topic, setTopic] = useState("Marketing Hub + IA Studio");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    content: string;
    hashtags?: string[];
    cta?: string;
    source?: string;
  } | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; title: string | null; content: string; type: string }>>([]);

  const [imgTemplate, setImgTemplate] = useState("banner_app");
  const [imgSize, setImgSize] = useState("square");
  const [imgHeadline, setImgHeadline] = useState("Marketing Hub + IA Studio");
  const [imgBusy, setImgBusy] = useState(false);
  const [imgResult, setImgResult] = useState<string | null>(null);
  const [imgHistory, setImgHistory] = useState<Array<{ id: string; imageUrl: string | null; title: string | null }>>([]);

  useEffect(() => {
    if (enabledPlatforms.length && !enabledPlatforms.includes(platform)) {
      setPlatform(enabledPlatforms[0]);
    }
  }, [enabledPlatforms, platform]);

  useEffect(() => {
    (async () => {
      const [c, i] = await Promise.all([
        fetch("/api/ai/content"),
        fetch("/api/ai/image"),
      ]);
      if (c.ok) setHistory(await c.json());
      if (i.ok) setImgHistory(await i.json());
    })();
  }, []);

  const generateContent = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, platform, tone, topic }),
      });
      if (!res.ok) throw new Error("fail");
      const data = await res.json();
      let hashtags: string[] = [];
      try {
        hashtags = JSON.parse(data.meta || "{}").hashtags || data.hashtags || [];
      } catch {
        hashtags = data.hashtags || [];
      }
      setResult({
        title: data.title,
        content: data.content,
        hashtags,
        cta: data.cta || JSON.parse(data.meta || "{}").cta,
        source: data.source || JSON.parse(data.meta || "{}").source,
      });
      setHistory((h) => [data, ...h].slice(0, 50));
      toast({ title: "Contenido generado", description: data.source === "openai" ? "OpenAI" : "Motor local de producción" });
    } catch {
      toast({ title: "Error al generar", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const generateImage = async () => {
    setImgBusy(true);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: imgTemplate,
          size: imgSize,
          headline: imgHeadline,
        }),
      });
      if (!res.ok) throw new Error("fail");
      const data = await res.json();
      setImgResult(data.imageUrl);
      setImgHistory((h) => [data, ...h].slice(0, 30));
      toast({ title: "Imagen generada" });
    } catch {
      toast({ title: "Error al generar imagen", variant: "destructive" });
    } finally {
      setImgBusy(false);
    }
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copiado" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          IA Studio
        </h2>
        <p className="text-sm text-muted-foreground">
          Generador de contenido (7 tipos) e imágenes para campañas
        </p>
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Contenido IA</TabsTrigger>
          <TabsTrigger value="images">Imágenes IA</TabsTrigger>
          <TabsTrigger value="library">Biblioteca</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generador de contenido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONTENT_TYPES.map((t) => (
                    <Button
                      key={t}
                      type="button"
                      size="sm"
                      variant={type === t ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setType(t)}
                    >
                      {CONTENT_TYPE_LABELS[t].emoji} {CONTENT_TYPE_LABELS[t].label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Plataforma</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {enabledPlatforms.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PLATFORM_CONFIG[p as keyof typeof PLATFORM_CONFIG]?.label || p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tono</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t} value={t}>{TONE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tema / briefing</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
              <Button onClick={generateContent} disabled={generating} className="gap-2 w-full">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Generar contenido
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Resultado
                {result?.source && <Badge variant="secondary">{result.source}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!result && (
                <p className="text-sm text-muted-foreground py-10 text-center">
                  Genera un post, caption, anuncio, hashtags, calendario, email o bio.
                </p>
              )}
              {result && (
                <>
                  <p className="font-semibold text-sm">{result.title}</p>
                  <Textarea readOnly value={result.content} rows={12} className="font-mono text-xs" />
                  {!!result.hashtags?.length && (
                    <p className="text-xs text-muted-foreground">{result.hashtags.join(" ")}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => copyText(`${result.title}\n\n${result.content}\n\n${(result.hashtags || []).join(" ")}`)}>
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </Button>
                    {onUseAsPost && (
                      <Button size="sm" onClick={() => onUseAsPost(`${result.title}\n\n${result.content}\n\n${(result.hashtags || []).join(" ")}`)}>
                        Usar como post
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generador de imágenes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Template rápido</Label>
                <div className="grid grid-cols-2 gap-2">
                  {IMAGE_TEMPLATES.map((t) => (
                    <Button key={t} type="button" size="sm" variant={imgTemplate === t ? "default" : "outline"} onClick={() => setImgTemplate(t)}>
                      {IMAGE_TEMPLATE_LABELS[t]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tamaño</Label>
                <Select value={imgSize} onValueChange={setImgSize}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {IMAGE_SIZES.map((s) => (
                      <SelectItem key={s} value={s}>{IMAGE_SIZE_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input value={imgHeadline} onChange={(e) => setImgHeadline(e.target.value)} />
              </div>
              <Button onClick={generateImage} disabled={imgBusy} className="w-full gap-2">
                {imgBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generar imagen
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Vista previa</CardTitle>
            </CardHeader>
            <CardContent>
              {imgResult ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgResult} alt="AI generated" className="w-full rounded-lg border bg-muted" />
              ) : (
                <div className="aspect-square rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground">
                  Sin imagen aún
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <h3 className="text-sm font-semibold">Contenido reciente</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {history.slice(0, 8).map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3 space-y-2">
                  <Badge variant="outline">{item.type}</Badge>
                  <p className="text-xs font-medium line-clamp-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{item.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <h3 className="text-sm font-semibold pt-2">Imágenes recientes</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {imgHistory.slice(0, 6).map((item) => (
              <Card key={item.id}>
                <CardContent className="p-2">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.title || "img"} className="w-full h-28 object-cover rounded" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
