import { z } from "zod";

export const GeneratedContentPackSchema = z.object({
  version: z.literal("2"),
  topic: z.string().min(3).max(140),
  strategy: z.object({
    audience: z.string().min(3).max(160),
    goal: z.string().min(3).max(160),
    angle: z.string().min(3).max(240),
    whyItWorks: z.string().min(3).max(280),
    platform: z.enum(["Instagram Reels", "YouTube Shorts", "TikTok", "Short-form vertical"]),
    aspectRatio: z.literal("9:16"),
    durationSeconds: z.number().int().min(10).max(180),
    language: z.string().min(2).max(60),
  }),
  voice: z.object({
    provider: z.literal("ElevenLabs"),
    name: z.string().min(2).max(100),
    voiceId: z.string().nullable(),
    delivery: z.string().min(10).max(220),
  }),
  scenes: z
    .array(
      z.object({
        time: z.string().min(2).max(20),
        purpose: z.enum(["Hook", "Context", "Build", "Proof", "Payoff", "CTA"]),
        voiceover: z.string().min(3).max(500),
        onScreenText: z.string().max(100),
        shot: z.string().min(10).max(240),
        imagePrompt: z.string().min(140).max(700),
        videoPrompt: z.string().min(120).max(650),
      }),
    )
    .min(3)
    .max(6),
  thumbnail: z.object({
    headline: z.string().min(2).max(60),
    subheadline: z.string().max(90).nullable(),
    concept: z.string().min(10).max(250),
    prompt: z.string().min(180).max(900),
    alternates: z
      .array(
        z.object({
          headline: z.string().min(2).max(60),
          concept: z.string().min(10).max(180),
          imagePrompt: z.string().min(180).max(900).optional(),
        }),
      )
      .length(2),
  }),
  caption: z.string().min(10).max(1000),
  hashtags: z.array(z.string().min(2).max(40)).min(6).max(10),
  sources: z
    .array(
      z.object({
        claim: z.string().min(3).max(240),
        url: z.string().url(),
        publisher: z.string().max(120).nullable(),
      }),
    )
    .max(6),
});

export type GeneratedContentPack = z.infer<typeof GeneratedContentPackSchema>;

export type ReferenceAsset = {
  id: string;
  label: string;
  type: "logo" | "thumbnail" | "source";
  imageUrl: string;
  sourceUrl: string;
  sourceName: string;
};

export type GenerationMetrics = {
  model: string;
  requestCount: 1;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  webSearchUsed: boolean;
};

export type ContentPackData = GeneratedContentPack & {
  fullVoiceover: string;
  referenceAssets: ReferenceAsset[];
  generation: GenerationMetrics;
};

type LegacyContentPack = {
  topic?: string;
  niche?: string | null;
  format?: string | null;
  whyViral?: string;
  script?: {
    dialogue?: string;
    voiceDirection?: string;
    suggestedElevenLabsVoice?: {
      name?: string | null;
      voiceId?: string | null;
    } | null;
  };
  visuals?: Array<{
    beat?: string;
    onScreenText?: string | null;
    imagePrompt?: string;
    videoPrompt?: string;
  }>;
  thumbnailPrompts?: string[];
  caption?: string;
  hashtags?: string[];
  sources?: Array<{ claim?: string; url?: string; publisher?: string | null }>;
  referenceAssets?: ReferenceAsset[];
  generation?: GenerationMetrics;
};

const fallbackMetrics: GenerationMetrics = {
  model: "legacy",
  requestCount: 1,
  latencyMs: 0,
  inputTokens: 0,
  outputTokens: 0,
  cachedInputTokens: 0,
  webSearchUsed: false,
};

function verticalPrompt(prompt: string, kind: "image" | "video" | "thumbnail") {
  const cleaned = prompt.trim();
  if (/\b9:16\b/.test(cleaned) && /1080\s*x\s*1920|1080x1920/i.test(cleaned)) {
    return cleaned;
  }
  const prefix =
    kind === "video"
      ? "9:16 vertical video, 1080x1920 for Reels and Shorts."
      : kind === "thumbnail"
        ? "9:16 vertical thumbnail, 1080x1920 for Reels and Shorts."
        : "9:16 vertical image, 1080x1920 for Reels and Shorts.";
  return `${prefix} ${cleaned}`.trim();
}

export function finalizeContentPack(
  generated: GeneratedContentPack,
  generation: GenerationMetrics,
  referenceAssets: ReferenceAsset[] = [],
): ContentPackData {
  const scenes = generated.scenes.map((scene) => ({
    ...scene,
    imagePrompt: verticalPrompt(scene.imagePrompt, "image"),
    videoPrompt: verticalPrompt(scene.videoPrompt, "video"),
  }));

  return {
    ...generated,
    strategy: { ...generated.strategy, aspectRatio: "9:16" },
    scenes,
    thumbnail: {
      ...generated.thumbnail,
      prompt: verticalPrompt(generated.thumbnail.prompt, "thumbnail"),
    },
    fullVoiceover: scenes
      .map((scene) => scene.voiceover.trim())
      .filter(Boolean)
      .join("\n\n"),
    referenceAssets,
    generation,
  };
}

export function normalizeContentPack(raw: unknown): ContentPackData {
  const parsed = GeneratedContentPackSchema.safeParse(raw);
  if (parsed.success) {
    const candidate = raw as Partial<ContentPackData>;
    return finalizeContentPack(
      parsed.data,
      candidate.generation ?? fallbackMetrics,
      candidate.referenceAssets ?? [],
    );
  }

  const legacy = (raw ?? {}) as LegacyContentPack;
  const visuals = legacy.visuals?.length
    ? legacy.visuals
    : [
        {
          beat: "0-5s",
          onScreenText: legacy.topic ?? "Opening hook",
          imagePrompt: "Creator delivering the opening line directly to camera.",
          videoPrompt: "Fast push-in as the creator delivers the opening line.",
        },
      ];
  const durationSeconds = Math.max(15, visuals.length * 8);
  const scenes: GeneratedContentPack["scenes"] = visuals.slice(0, 6).map((visual, index) => ({
    time: visual.beat || `${index * 5}-${(index + 1) * 5}s`,
    purpose: index === 0 ? "Hook" : index === visuals.length - 1 ? "CTA" : "Build",
    voiceover: index === 0 ? legacy.script?.dialogue?.trim() || "Open with the core idea." : "",
    onScreenText: visual.onScreenText ?? "",
    shot: visual.beat || "Direct-to-camera vertical shot",
    imagePrompt: verticalPrompt(visual.imagePrompt || "Creator-led vertical scene.", "image"),
    videoPrompt: verticalPrompt(
      visual.videoPrompt || "Creator-led vertical motion scene.",
      "video",
    ),
  }));

  const thumbnailPrompts = legacy.thumbnailPrompts ?? [];
  const generated: GeneratedContentPack = {
    version: "2",
    topic: legacy.topic || "Untitled content pack",
    strategy: {
      audience: legacy.niche || "Short-form viewers",
      goal: "Create a clear, publishable vertical video",
      angle: legacy.whyViral || "Lead with a direct, useful angle.",
      whyItWorks: legacy.whyViral || "The structure moves quickly from hook to payoff.",
      platform: "Short-form vertical",
      aspectRatio: "9:16",
      durationSeconds,
      language: "As requested",
    },
    voice: {
      provider: "ElevenLabs",
      name: legacy.script?.suggestedElevenLabsVoice?.name || "Natural creator voice",
      voiceId: legacy.script?.suggestedElevenLabsVoice?.voiceId || null,
      delivery: legacy.script?.voiceDirection || "Conversational, confident, and quick.",
    },
    scenes,
    thumbnail: {
      headline: legacy.topic?.slice(0, 60) || "Watch this",
      subheadline: null,
      concept: "A clear vertical first frame with one subject and one readable headline.",
      prompt: verticalPrompt(
        thumbnailPrompts[0] || "High-contrast creator thumbnail with a bold headline.",
        "thumbnail",
      ),
      alternates: [
        {
          headline: "The real story",
          concept: thumbnailPrompts[1] || "Close-up reaction with strong negative space.",
        },
        {
          headline: "Here is why",
          concept: thumbnailPrompts[2] || "Product or proof point placed beside the creator.",
        },
      ],
    },
    caption: legacy.caption || "",
    hashtags: legacy.hashtags?.slice(0, 10) || [],
    sources: (legacy.sources ?? [])
      .filter((source): source is { claim: string; url: string; publisher?: string | null } =>
        Boolean(source.claim && source.url),
      )
      .slice(0, 6)
      .map((source) => ({
        claim: source.claim,
        url: source.url,
        publisher: source.publisher ?? null,
      })),
  };

  const normalized = finalizeContentPack(
    generated,
    legacy.generation ?? fallbackMetrics,
    legacy.referenceAssets ?? [],
  );
  normalized.fullVoiceover = legacy.script?.dialogue || normalized.fullVoiceover;
  return normalized;
}
