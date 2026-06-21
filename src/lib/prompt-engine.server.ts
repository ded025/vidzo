import type { GeneratedContentPack } from "@/lib/content-pack";

export type PromptPreset = {
  name?: string | null;
  niche?: string | null;
  audience?: string | null;
  tone?: string | null;
  language?: string | null;
  default_voice_id?: string | null;
  default_voice_name?: string | null;
};

const RESEARCH_PATTERN =
  /\b(latest|today|current|recent|trend|trending|viral|news|launch|update|funding|market|price|ranking|statistic|study|report|source|research|verify|brand|company|founder|celebrity|politic|election|202[4-9])\b/i;

const NO_RESEARCH_PATTERN =
  /\b(do not browse|no research|without research|evergreen|hypothetical)\b/i;

export function shouldUseWebResearch(userRequest: string, lockedBrief?: string | null) {
  const combined = `${lockedBrief ?? ""}\n${userRequest}`;
  if (NO_RESEARCH_PATTERN.test(combined)) return false;
  return RESEARCH_PATTERN.test(combined) || /https?:\/\//i.test(combined);
}

function compactPreviousPack(pack: unknown) {
  const candidate = pack as Partial<GeneratedContentPack> | null;
  if (!candidate || candidate.version !== "2") return pack;
  return {
    version: candidate.version,
    topic: candidate.topic,
    strategy: candidate.strategy,
    voice: candidate.voice,
    scenes: candidate.scenes,
    thumbnail: candidate.thumbnail,
    caption: candidate.caption,
    hashtags: candidate.hashtags,
    sources: candidate.sources,
  };
}

export function buildPromptEngineInput({
  userRequest,
  lockedBrief,
  preset,
  currentPack,
  research,
}: {
  userRequest: string;
  lockedBrief?: string | null;
  preset?: PromptPreset | null;
  currentPack?: unknown;
  research: boolean;
}) {
  const mode = currentPack ? "revise" : "create";
  return JSON.stringify({
    mode,
    userRequest,
    lockedBrief: lockedBrief || null,
    preset: preset
      ? {
          name: preset.name || null,
          niche: preset.niche || null,
          audience: preset.audience || null,
          tone: preset.tone || null,
          language: preset.language || null,
          voiceName: preset.default_voice_name || null,
          voiceId: preset.default_voice_id || null,
        }
      : null,
    research: research
      ? "Use one focused web search only when factual grounding is needed."
      : "Do not browse.",
    currentPack: currentPack ? compactPreviousPack(currentPack) : null,
  });
}
