// Deterministic, content-specific quality scoring for a generated pack.
// No randomness — purely derived from the pack itself.

export type QualityInput = {
  script: { dialogue: string; voiceDirection?: string };
  visuals: Array<{ beat: string; imagePrompt: string; videoPrompt: string; onScreenText?: string }>;
  thumbnailPrompts: string[];
  caption: string;
  hashtags: string[];
  sources: Array<{ url: string; claim: string }>;
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function scoreHook(dialogue: string): number {
  const first = dialogue.split(/[.!?\n]/)[0]?.trim() ?? "";
  const len = first.length;
  // Sweet spot 30-110 chars for a punchy hook
  if (len === 0) return 0;
  if (len < 20) return 45;
  if (len <= 110) return 95;
  if (len <= 160) return 75;
  return 55;
}

function scorePacing(dialogue: string): number {
  const words = dialogue.trim().split(/\s+/).filter(Boolean).length;
  // 60-220 words ≈ 25-90 seconds at natural pace
  if (words < 40) return 50;
  if (words <= 220) return 92;
  if (words <= 300) return 75;
  return 60;
}

function scoreSources(sources: QualityInput["sources"]): number {
  const n = sources?.length ?? 0;
  if (n === 0) return 40; // generic/hypothetical content
  if (n === 1) return 65;
  if (n === 2) return 80;
  if (n >= 3) return clamp(85 + (n - 3) * 3);
  return 50;
}

function scoreVisuals(visuals: QualityInput["visuals"]): number {
  const n = visuals?.length ?? 0;
  const avgLen =
    n === 0
      ? 0
      : visuals.reduce((a, v) => a + (v.imagePrompt?.length ?? 0) + (v.videoPrompt?.length ?? 0), 0) /
        (n * 2);
  const beatScore = n < 3 ? 50 : n <= 8 ? 90 : 75;
  const detailScore = avgLen < 60 ? 55 : avgLen < 140 ? 80 : 95;
  return Math.round((beatScore + detailScore) / 2);
}

function scorePlatformFit(caption: string, hashtags: string[], thumbs: string[]): number {
  const capLen = caption?.length ?? 0;
  const hLen = hashtags?.length ?? 0;
  const tLen = thumbs?.length ?? 0;
  const cap = capLen === 0 ? 30 : capLen < 50 ? 60 : capLen <= 220 ? 92 : 75;
  const hash = hLen >= 8 && hLen <= 15 ? 95 : hLen > 0 ? 70 : 30;
  const thumb = tLen >= 3 ? 95 : tLen > 0 ? 70 : 30;
  return Math.round((cap + hash + thumb) / 3);
}

export type QualityReport = {
  overall: number;
  reach: number;
  metrics: Array<{ key: string; label: string; value: number }>;
};

export function computeQuality(pack: QualityInput): QualityReport {
  const m = {
    hook: clamp(scoreHook(pack.script.dialogue)),
    pacing: clamp(scorePacing(pack.script.dialogue)),
    sources: clamp(scoreSources(pack.sources ?? [])),
    visuals: clamp(scoreVisuals(pack.visuals ?? [])),
    platform: clamp(scorePlatformFit(pack.caption, pack.hashtags ?? [], pack.thumbnailPrompts ?? [])),
  };
  // Weighted overall — hook + sources matter most for virality
  const overall = Math.round(
    m.hook * 0.28 + m.pacing * 0.18 + m.sources * 0.22 + m.visuals * 0.16 + m.platform * 0.16,
  );
  // Reach potential: hook + platform fit + sources credibility
  const reach = Math.round(m.hook * 0.5 + m.platform * 0.3 + m.sources * 0.2);
  return {
    overall,
    reach,
    metrics: [
      { key: "hook", label: "Hook Strength", value: m.hook },
      { key: "pacing", label: "Pacing", value: m.pacing },
      { key: "sources", label: "Source Backing", value: m.sources },
      { key: "visuals", label: "Visual Plan", value: m.visuals },
      { key: "platform", label: "Platform Fit", value: m.platform },
    ],
  };
}
