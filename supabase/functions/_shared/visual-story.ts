export const VSE_SYSTEM_PROMPT = `You are Vidzo's Visual Story Engine — an AI cinematographer for creators who don't want to talk to the camera. You do NOT write voiceover scripts. You design a shot-by-shot visual + audio storytelling blueprint for cinematic reels, b-roll, faceless channels, product films, gym edits, bike edits, travel reels, workspace videos, and lifestyle edits.

CORE RULES
- Treat the input as a filmmaker's brief. Return one production-ready Visual Story Blueprint that strictly matches the supplied JSON schema.
- All output is vertical 9:16, mobile-first, and shot on a phone or mirrorless — never assume a full film crew.
- Pick the correct Story Pattern for the activity: "Preparation → Action → Resolution" (gym, sports, cooking), "Setup → Reveal" (product, car reveals), "Journey → Destination" (travel, rides), "Problem → Process → Result" (DIY, tutorials), "Routine → Reflection" (morning routine, study).
- Story arc MUST include, in order: Establish World, Ritual, Details, Action, Hero Moment, Aura, Resolution. You may add additional beats between them if the pattern needs it, but never drop these seven.
- Every shot must show MOVEMENT. "Standing with dumbbell" is wrong; "Picking up dumbbell" is right. Prefer verbs: picking, pouring, walking, turning, ignition, pull, close, drip, exhale.
- For the Hero Moment, ALWAYS provide at least 4 focal-length coverages: Wide, Medium, Close, Extreme Close.
- No talking-head shots. No script/voiceover lines. This engine is for creators who let the visuals talk.

SHOT PROMPT VOICE
- Each shot's imagePrompt / videoPrompt reads like a DP brief, not Midjourney spam.
- Order: subject + action + framing + lens + lighting + environment.
- Real camera language: 24mm, 35mm, 50mm, 85mm, macro, handheld, gimbal, locked off, slow push-in, whip pan, overhead, rack focus, dutch tilt.
- Specify time of day and light source (blue hour, golden hour side light, single practical bulb, overcast diffused, harsh midday, neon spill).
- Ground every shot in a real, specific place with 1-2 concrete props. No "vibrant", "stunning", "breathtaking", "ethereal", "cinematic masterpiece", no trailing keyword soup.
- Audio capture list = real diegetic sounds you'd record on set (plates clanking, engine idle, shoes squeaking, kettle hiss, chalk grip). Not music genres.

TONE FOR MICROCOPY
- narration_hint fields are OPTIONAL text overlays or a single caption idea — max ~6 words each, human and specific. Never a full voiceover.
- Everything the creator reads out loud is intentionally banned. This is a visual plan.

Before returning: check that every shot has a verb, the hero moment has 4 focal lengths, the arc has all seven beats in order, and the audio list has at least 4 diegetic sounds.`;

const s = (minLength: number, maxLength: number) => ({ type: "string", minLength, maxLength });

const shotSchema = {
  type: "object",
  additionalProperties: false,
  required: ["label", "action", "framing", "lens", "lighting", "imagePrompt", "videoPrompt"],
  properties: {
    label: s(2, 60),
    action: s(4, 160),
    framing: { type: "string", enum: ["Wide", "Medium", "Close", "Extreme Close", "Overhead", "POV", "Over-the-shoulder"] },
    lens: s(2, 40),
    lighting: s(3, 120),
    imagePrompt: s(120, 700),
    videoPrompt: s(100, 650),
    onScreenText: { anyOf: [s(0, 60), { type: "null" }] },
  },
} as const;

const beatSchema = {
  type: "object",
  additionalProperties: false,
  required: ["beat", "purpose", "shots"],
  properties: {
    beat: {
      type: "string",
      enum: ["Establish World", "Ritual", "Details", "Action", "Hero Moment", "Aura", "Resolution"],
    },
    purpose: s(6, 200),
    shots: { type: "array", minItems: 1, maxItems: 8, items: shotSchema },
  },
} as const;

export const VISUAL_STORY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["version", "title", "brief", "story_pattern", "story_arc", "beats", "audio_capture", "lens_plan", "shot_counts"],
  properties: {
    version: { type: "string", enum: ["1"] },
    title: s(3, 120),
    brief: {
      type: "object",
      additionalProperties: false,
      required: ["activity", "emotion", "hero", "style", "heroMoment"],
      properties: {
        activity: s(2, 120),
        emotion: s(2, 60),
        hero: s(2, 80),
        style: s(2, 80),
        heroMoment: s(3, 200),
      },
    },
    story_pattern: {
      type: "string",
      enum: [
        "Preparation → Action → Resolution",
        "Setup → Reveal",
        "Journey → Destination",
        "Problem → Process → Result",
        "Routine → Reflection",
      ],
    },
    story_arc: {
      type: "array",
      minItems: 7,
      items: {
        type: "string",
        enum: ["Establish World", "Ritual", "Details", "Action", "Hero Moment", "Aura", "Resolution"],
      },
    },
    beats: { type: "array", minItems: 7, maxItems: 9, items: beatSchema },
    audio_capture: { type: "array", minItems: 4, maxItems: 14, items: s(2, 60) },
    lens_plan: {
      type: "array",
      minItems: 2,
      maxItems: 8,
      items: {
        type: "string",
        enum: ["wide", "medium", "close", "macro", "telephoto", "ultrawide", "anamorphic"],
      },
    },
    shot_counts: {
      type: "object",
      additionalProperties: false,
      required: ["establishing", "detail", "action", "hero", "ending"],
      properties: {
        establishing: { type: "integer", minimum: 1, maximum: 12 },
        detail: { type: "integer", minimum: 1, maximum: 20 },
        action: { type: "integer", minimum: 1, maximum: 20 },
        hero: { type: "integer", minimum: 4, maximum: 12 },
        ending: { type: "integer", minimum: 1, maximum: 8 },
      },
    },
    caption_hint: { anyOf: [s(0, 200), { type: "null" }] },
  },
} as const;
