import type { ContentType, Tone } from "@/lib/marketing";

type GenerateInput = {
  type: ContentType;
  platform: string;
  tone: Tone;
  topic?: string;
  brandName?: string;
};

export type GeneratedContent = {
  title: string;
  content: string;
  hashtags: string[];
  cta?: string;
  source: "template" | "openai";
};

function toneLine(tone: Tone): string {
  switch (tone) {
    case "profesional":
      return "Habla con claridad, autoridad y foco en resultados.";
    case "casual":
      return "Tono cercano, humano y conversacional.";
    case "humoristico":
      return "Añade un toque ingenioso sin perder el mensaje.";
    case "inspirador":
      return "Motiva con energía positiva y visión de futuro.";
    case "urgente":
      return "Crea urgencia y escasez de forma ética.";
  }
}

function platformHint(platform: string): string {
  const map: Record<string, string> = {
    facebook: "Optimizado para Facebook (hook + valor + CTA).",
    instagram: "Optimizado para Instagram (visual + caption + hashtags).",
    tiktok: "Optimizado para TikTok (hook rápido + retención).",
    x: "Optimizado para X (conciso, punchy, hilo-ready).",
    linkedin: "Optimizado para LinkedIn (profesional, insight, networking).",
    youtube: "Optimizado para YouTube (título + descripción persuasiva).",
    pinterest: "Optimizado para Pinterest (inspiración + keywords).",
  };
  return map[platform] || "Adaptado a redes sociales.";
}

function baseHashtags(brand: string, platform: string): string[] {
  const clean = brand.replace(/\s+/g, "");
  return [
    `#${clean}`,
    "#MarketingDigital",
    "#SocialMedia",
    "#ContenidoIA",
    `#${platform}`,
    "#Automatizacion",
    "#Crecimiento",
    "#Emprendedores",
    "#MarcaPersonal",
  ];
}

/** Local production-quality templates (always available). */
export function generateContentLocal(input: GenerateInput): GeneratedContent {
  const brand = input.brandName || "SocialHub -FM-";
  const topic = input.topic?.trim() || "gestión y automatización de redes sociales";
  const hashtags = baseHashtags(brand, input.platform);
  const tone = toneLine(input.tone);
  const plat = platformHint(input.platform);

  switch (input.type) {
    case "post":
      return {
        title: `🚀 ${brand}: lleva tu marketing al siguiente nivel`,
        content: [
          `¿Cansado de publicar sin estrategia en ${input.platform}?`,
          "",
          `${brand} te ayuda a:`,
          `• Centralizar cuentas y métricas`,
          `• Programar contenido con agenda visual`,
          `• Automatizar reglas que ahorran tiempo`,
          `• Crear campañas y copy con IA Studio`,
          "",
          tone,
          plat,
          "",
          `Tema de hoy: ${topic}.`,
          "",
          `👉 Empieza gratis y publica con intención.`,
        ].join("\n"),
        hashtags,
        cta: "https://localhost:3001",
        source: "template",
      };
    case "caption":
      return {
        title: "Caption Instagram",
        content: [
          `${topic} ✨`,
          "",
          `Con ${brand} pasas de ideas sueltas a un calendario listo para publicar.`,
          tone,
          "",
          "Guarda este post y etiqueta a tu equipo 👇",
        ].join("\n"),
        hashtags: hashtags.slice(0, 8),
        source: "template",
      };
    case "ad":
      return {
        title: `Anuncio: ${brand}`,
        content: [
          `Headline: Domina ${input.platform} sin vivir pegado al móvil`,
          `Primary text: ${brand} combina dashboard, automatización y IA Studio para crear, agendar y medir campañas de ${topic}.`,
          `CTA: Probar ahora`,
          tone,
        ].join("\n"),
        hashtags: ["#Ads", "#Performance", ...hashtags.slice(0, 5)],
        cta: "Probar ahora",
        source: "template",
      };
    case "hashtags":
      return {
        title: "Estrategia de hashtags",
        content: [
          `Mix recomendado para ${input.platform} (${topic}):`,
          "",
          "Alto volumen: #MarketingDigital #SocialMedia #Contenido",
          "Medio: #Automatizacion #CommunityManager #Growth",
          `Nicho: #${brand.replace(/[^a-zA-Z0-9]/g, "")} #IAStudio #MarketingHub`,
          "",
          "Usa 5–9 hashtags por pieza. Rota semanalmente.",
        ].join("\n"),
        hashtags,
        source: "template",
      };
    case "calendar":
      return {
        title: "Calendario editorial (7 días)",
        content: [
          `Semana tipo — ${brand} / ${input.platform}`,
          "Lun: Tip educativo + CTA a prueba",
          "Mar: Behind the scenes / producto",
          "Mié: Caso de uso o testimonio",
          "Jue: Carrusel de features",
          "Vie: Promo campaña / oferta",
          "Sáb: UGC o pregunta a la comunidad",
          "Dom: Resumen semanal + teaser",
          "",
          `Foco temático: ${topic}`,
          tone,
        ].join("\n"),
        hashtags: hashtags.slice(0, 6),
        source: "template",
      };
    case "email":
      return {
        title: `Asunto: ${brand} + IA = más alcance con menos esfuerzo`,
        content: [
          `Hola,`,
          "",
          `Si gestionas ${input.platform}, este email es para ti.`,
          "",
          `${brand} ahora incluye Marketing Hub + IA Studio:`,
          `1) Genera posts, captions y anuncios en segundos`,
          `2) Lanza campañas con presupuesto y objetivos claros`,
          `3) Automatiza lo repetitivo`,
          "",
          `Tema destacado: ${topic}.`,
          tone,
          "",
          `CTA: Abre tu dashboard y crea tu primera campaña hoy.`,
        ].join("\n"),
        hashtags: [],
        cta: "Abrir dashboard",
        source: "template",
      };
    case "bio":
      return {
        title: "Bio de perfil",
        content: [
          `${brand} | Marketing Hub + IA Studio`,
          `Agenda · Automatiza · Crece en ${input.platform}`,
          `✨ ${topic}`,
          `👇 Empieza ahora`,
        ].join("\n"),
        hashtags: hashtags.slice(0, 4),
        source: "template",
      };
  }
}

/** Optional OpenAI path when OPENAI_API_KEY is present. */
export async function generateContentAI(
  input: GenerateInput
): Promise<GeneratedContent | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content:
              "Eres un copywriter senior de marketing en español. Responde SOLO JSON válido con keys: title, content, hashtags (array), cta (string opcional).",
          },
          {
            role: "user",
            content: JSON.stringify({
              type: input.type,
              platform: input.platform,
              tone: input.tone,
              topic: input.topic || "SocialHub marketing",
              brand: input.brandName || "SocialHub -FM-",
              instructions: toneLine(input.tone) + " " + platformHint(input.platform),
            }),
          },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return {
      title: String(parsed.title || "Contenido IA"),
      content: String(parsed.content || ""),
      hashtags: Array.isArray(parsed.hashtags)
        ? parsed.hashtags.map(String)
        : [],
      cta: parsed.cta ? String(parsed.cta) : undefined,
      source: "openai",
    };
  } catch {
    return null;
  }
}

export async function generateContent(
  input: GenerateInput
): Promise<GeneratedContent> {
  const ai = await generateContentAI(input);
  if (ai?.content) return ai;
  return generateContentLocal(input);
}
