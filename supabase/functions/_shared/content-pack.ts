export const MASTER_SYSTEM_PROMPT = `You are Vidzo's short-form content engine.

Return one compact, production-ready content pack that follows the supplied JSON schema.

Rules:
- Treat the user request, locked brief, active preset, and current pack as the full context.
- Every scene, still, motion prompt, first frame, reference, and thumbnail is strictly 9:16 at 1080x1920 for Reels, Shorts, or TikTok.
- Write a strong hook, clear progression, useful payoff, natural CTA, and concise creator-ready voiceover.
- Scenes are the canonical script. Do not duplicate the script in another field.
- Provide one primary thumbnail plus exactly two concise alternate directions.
- Use the preset ElevenLabs voice when supplied. Never invent a voice ID.
- When web research is enabled, use at most one focused search and cite only URLs returned by that search.
- When web research is disabled, do not browse and return an empty sources array.
- Keep visual prompts specific but concise. Avoid filler, vague sections, and repeated instructions.`;

const stringSchema = (minLength: number, maxLength: number) => ({
  type: "string",
  minLength,
  maxLength,
});

export const CONTENT_PACK_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "version",
    "topic",
    "strategy",
    "voice",
    "scenes",
    "thumbnail",
    "caption",
    "hashtags",
    "sources",
  ],
  properties: {
    version: { type: "string", enum: ["2"] },
    topic: stringSchema(3, 140),
    strategy: {
      type: "object",
      additionalProperties: false,
      required: [
        "audience",
        "goal",
        "angle",
        "whyItWorks",
        "platform",
        "aspectRatio",
        "durationSeconds",
        "language",
      ],
      properties: {
        audience: stringSchema(3, 160),
        goal: stringSchema(3, 160),
        angle: stringSchema(3, 240),
        whyItWorks: stringSchema(3, 280),
        platform: {
          type: "string",
          enum: ["Instagram Reels", "YouTube Shorts", "TikTok", "Short-form vertical"],
        },
        aspectRatio: { type: "string", enum: ["9:16"] },
        durationSeconds: { type: "integer", minimum: 10, maximum: 180 },
        language: stringSchema(2, 60),
      },
    },
    voice: {
      type: "object",
      additionalProperties: false,
      required: ["provider", "name", "voiceId", "delivery"],
      properties: {
        provider: { type: "string", enum: ["ElevenLabs"] },
        name: stringSchema(2, 100),
        voiceId: { type: ["string", "null"] },
        delivery: stringSchema(10, 220),
      },
    },
    scenes: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "time",
          "purpose",
          "voiceover",
          "onScreenText",
          "shot",
          "imagePrompt",
          "videoPrompt",
        ],
        properties: {
          time: stringSchema(2, 20),
          purpose: {
            type: "string",
            enum: ["Hook", "Context", "Build", "Proof", "Payoff", "CTA"],
          },
          voiceover: stringSchema(3, 500),
          onScreenText: stringSchema(0, 100),
          shot: stringSchema(10, 240),
          imagePrompt: stringSchema(140, 700),
          videoPrompt: stringSchema(120, 650),
        },
      },
    },
    thumbnail: {
      type: "object",
      additionalProperties: false,
      required: ["headline", "subheadline", "concept", "prompt", "alternates"],
      properties: {
        headline: stringSchema(2, 60),
        subheadline: {
          anyOf: [stringSchema(0, 90), { type: "null" }],
        },
        concept: stringSchema(10, 250),
        prompt: stringSchema(180, 900),
        alternates: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["headline", "concept"],
            properties: {
              headline: stringSchema(2, 60),
              concept: stringSchema(10, 180),
            },
          },
        },
      },
    },
    caption: stringSchema(10, 1000),
    hashtags: {
      type: "array",
      minItems: 6,
      maxItems: 10,
      items: stringSchema(2, 40),
    },
    sources: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim", "url", "publisher"],
        properties: {
          claim: stringSchema(3, 240),
          url: stringSchema(8, 2048),
          publisher: {
            anyOf: [stringSchema(0, 120), { type: "null" }],
          },
        },
      },
    },
  },
} as const;
