import { z } from "zod";

export const HIGGSFIELD_PLATFORMS = [
  "instagram_reels",
  "tiktok",
  "youtube_shorts",
  "facebook_reels",
  "linkedin",
  "x",
] as const;

export const HIGGSFIELD_GOALS = [
  "conversions",
  "awareness",
  "lead_generation",
  "education",
  "app_installs",
  "retargeting",
] as const;

export const HIGGSFIELD_SCRIPT_STYLES = [
  "conversational",
  "soft_sell",
  "aggressive_sales",
  "educational",
  "luxury",
  "premium",
  "humorous",
] as const;

export const HIGGSFIELD_MOTION_INTENSITIES = ["subtle", "medium", "aggressive"] as const;

export const HIGGSFIELD_BUDGETS = ["low", "standard", "premium"] as const;
export const HIGGSFIELD_LATENCIES = ["fast", "balanced", "quality"] as const;

export const INTENT_CATEGORIES = [
  "UGC Testimonial",
  "Product Demo",
  "Product Unboxing",
  "Problem Solution",
  "Before After",
  "Founder Story",
  "TikTok Hook",
  "Comparison Ad",
  "Lifestyle Ad",
  "Street Interview",
  "AI Influencer",
  "Talking Head",
  "Voiceover B-roll",
  "Cinematic Commercial",
  "Feature Highlight",
  "App Demo",
  "SaaS Explainer",
] as const;

export const SCRIPT_FRAMEWORKS = [
  "PAS",
  "AIDA",
  "Story Framework",
  "Creator Testimonial",
  "Founder Story",
  "Comparison Ad",
] as const;

const PlatformSchema = z.enum(HIGGSFIELD_PLATFORMS);
const GoalSchema = z.enum(HIGGSFIELD_GOALS);
const ScriptStyleSchema = z.enum(HIGGSFIELD_SCRIPT_STYLES);
const MotionIntensitySchema = z.enum(HIGGSFIELD_MOTION_INTENSITIES);
const BudgetSchema = z.enum(HIGGSFIELD_BUDGETS);
const LatencySchema = z.enum(HIGGSFIELD_LATENCIES);

export const CreatorPersonaSchema = z.object({
  persona_name: z.string().min(2).max(120),
  age: z.number().int().min(16).max(75),
  gender: z.string().min(2).max(40),
  accent: z.string().min(2).max(80),
  energy: z.string().min(2).max(80),
  trust_level: z.string().min(2).max(80),
  creator_style: z.string().min(2).max(100),
  speaking_speed: z.string().min(2).max(80),
  tone: z.string().min(2).max(140),
  appearance: z.string().min(2).max(240),
});

export const HiggsfieldUserInputSchema = z.object({
  brief: z.string().min(3).max(12000),
  productName: z.string().max(160).optional(),
  productUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  landingPageUrl: z.string().url().optional().or(z.literal("")),
  competitorUrl: z.string().url().optional().or(z.literal("")),
  voiceNoteTranscript: z.string().max(12000).optional(),
  featureList: z.array(z.string().min(1).max(240)).max(30).optional(),
  productImages: z.array(z.string().url()).max(8).optional(),
  targetAudience: z.string().max(240).optional(),
  country: z.string().max(80).optional(),
  platform: PlatformSchema.optional(),
  duration: z.number().int().min(6).max(90).optional(),
  adFormat: z.string().max(100).optional(),
  creatorStyle: z.string().max(100).optional(),
  goal: GoalSchema.optional(),
  scriptStyle: ScriptStyleSchema.optional(),
  scriptFramework: z.enum(SCRIPT_FRAMEWORKS).optional(),
  motionIntensity: MotionIntensitySchema.optional(),
  budget: BudgetSchema.optional(),
  latency: LatencySchema.optional(),
  realismRequirement: z.number().min(0).max(100).optional(),
  creatorConsistency: z.number().min(0).max(100).optional(),
  motionComplexity: z.number().min(0).max(100).optional(),
  modelOverride: z.string().max(80).optional(),
  customPersona: CreatorPersonaSchema.partial().optional(),
  variationCount: z.number().int().min(1).max(20).optional(),
});

export type HiggsfieldPlatform = (typeof HIGGSFIELD_PLATFORMS)[number];
export type HiggsfieldGoal = (typeof HIGGSFIELD_GOALS)[number];
export type HiggsfieldScriptStyle = (typeof HIGGSFIELD_SCRIPT_STYLES)[number];
export type MotionIntensity = (typeof HIGGSFIELD_MOTION_INTENSITIES)[number];
export type ScriptFramework = (typeof SCRIPT_FRAMEWORKS)[number];
export type HiggsfieldUserInput = z.infer<typeof HiggsfieldUserInputSchema>;
export type CreatorPersona = z.infer<typeof CreatorPersonaSchema>;
export type IntentCategory = (typeof INTENT_CATEGORIES)[number];

export type PromptIntelligence = {
  industry: string;
  product_type: string;
  product_name: string;
  target_audience: string;
  marketing_goal: HiggsfieldGoal;
  platform: HiggsfieldPlatform;
  country: string;
  creator_style: string;
  duration: number;
  ad_format: string;
  language: string;
  key_features: string[];
  pain_points: string[];
  desired_outcomes: string[];
  objections: string[];
  usp: string[];
  proof_points: string[];
  urls: {
    product?: string;
    website?: string;
    landingPage?: string;
    competitor?: string;
  };
};

export type IntentDetection = {
  category: IntentCategory;
  subcategory: string;
  confidence: number;
};

export type BriefIntelligence = {
  industry: string;
  product_type: string;
  target_audience: string;
  pain_points: string[];
  desired_outcomes: string[];
  objections: string[];
  usp: string[];
  features: string[];
  proof_points: string[];
  source_inputs: string[];
};

export type ContentStrategy = {
  awareness_stage: "unaware" | "problem aware" | "solution aware" | "product aware" | "most aware";
  funnel_stage: "top funnel" | "middle funnel" | "bottom funnel";
  goal: HiggsfieldGoal;
  recommended_format: string;
  recommended_platform: HiggsfieldPlatform;
  recommended_persona: string;
  rationale: string;
};

export type HookCategory =
  | "Curiosity"
  | "Shock"
  | "Comparison"
  | "Social Proof"
  | "Problem"
  | "POV"
  | "Story"
  | "Question"
  | "Founder"
  | "Statistic";

export type HookVariation = {
  id: string;
  category: HookCategory;
  platform: HiggsfieldPlatform;
  hook: string;
  predicted_engagement_score: number;
  reason: string;
};

export type HiggsfieldScript = {
  framework: ScriptFramework;
  style: HiggsfieldScriptStyle;
  hook: string;
  problem: string;
  solution: string;
  proof: string;
  cta: string;
  full_script: string;
  duration_seconds: number;
};

export type MultiDurationScripts = {
  short_script: string;
  medium_script: string;
  long_script: string;
  extended_script: string;
  hook_variations: HookVariation[];
  cta_variations: string[];
};

export type CameraPreset = {
  preset_name: string;
  camera_type: string;
  lens: string;
  movement: string;
  framing: string;
  focus: string;
  best_for: string[];
};

export type MotionDirective = {
  primary_motion: string;
  secondary_motion: string;
  intensity: MotionIntensity;
  instructions: string;
  timing: string;
};

export type NegativePromptSet = {
  model: string;
  items: string[];
  prompt: string;
};

export type ModelRoute = {
  primary_model: string;
  fallback_model: string;
  route_key:
    | "ugc_talking_head"
    | "product_cinematic"
    | "character_consistency"
    | "fast_generation"
    | "realism"
    | "motion_heavy";
  reason: string;
  scores: Record<string, number>;
};

export type HiggsfieldPromptSchema = {
  SUBJECT: string;
  PRODUCT: string;
  ACTION: string;
  SCENE: string;
  CAMERA: string;
  EXPRESSION: string;
  STYLE: string;
  LIGHTING: string;
  SCRIPT: string;
  MOTION: string;
  AUDIO: string;
  OUTPUT: string;
  NEGATIVE: string;
};

export type CompiledHiggsfieldPrompt = {
  schema: HiggsfieldPromptSchema;
  yaml: string;
  json: Record<string, unknown>;
};

export type UGCVariation = {
  id: string;
  title: string;
  persona: CreatorPersona;
  hook: HookVariation;
  camera: CameraPreset;
  motion: MotionDirective;
  cta: string;
  script: HiggsfieldScript;
  model_route: ModelRoute;
  prompt: CompiledHiggsfieldPrompt;
  score: number;
};

export type HiggsfieldGenerationResult = {
  engine_version: "higgsfield-ugc-v1";
  input: HiggsfieldUserInput;
  intelligence: PromptIntelligence;
  brief_intelligence: BriefIntelligence;
  content_strategy: ContentStrategy;
  intent: IntentDetection;
  persona: CreatorPersona;
  hooks: HookVariation[];
  selected_hook: HookVariation;
  script: HiggsfieldScript;
  scripts: MultiDurationScripts;
  camera: CameraPreset;
  motion: MotionDirective;
  negative_prompt: NegativePromptSet;
  model_route: ModelRoute;
  prompt: CompiledHiggsfieldPrompt;
  variations: UGCVariation[];
  api_contracts: typeof HIGGSFIELD_API_CONTRACTS;
};

type IndustryRule = {
  industry: string;
  productFallback: string;
  terms: string[];
  audience: string;
  pain: string[];
  outcomes: string[];
  objections: string[];
  uspHints: string[];
};

const INDUSTRY_RULES: IndustryRule[] = [
  {
    industry: "skincare",
    productFallback: "skincare product",
    terms: ["serum", "vitamin c", "retinol", "sunscreen", "moisturizer", "acne", "skin"],
    audience: "skincare buyers who want visible results without a complicated routine",
    pain: ["dull skin", "uneven tone", "too many confusing skincare steps"],
    outcomes: ["brighter looking skin", "simpler routine", "more confidence on camera"],
    objections: [
      "skincare results feel slow",
      "fear of sticky texture",
      "concern about irritation",
    ],
    uspHints: ["easy daily routine", "lightweight feel", "glow focused formula"],
  },
  {
    industry: "health",
    productFallback: "wellness product",
    terms: ["supplement", "sleep", "protein", "gut", "vitamin", "nutrition", "wellness"],
    audience: "busy adults trying to improve health without adding complexity",
    pain: ["inconsistent routine", "low energy", "not knowing what actually works"],
    outcomes: ["better daily consistency", "more energy", "feeling in control"],
    objections: ["supplements do not work", "fear of side effects", "too many pills already"],
    uspHints: ["clean daily habit", "no complicated routine", "made for busy schedules"],
  },
  {
    industry: "fitness",
    productFallback: "fitness product",
    terms: ["fitness", "gym", "workout", "training", "creatine", "yoga", "weight loss"],
    audience: "fitness-conscious people who want practical progress",
    pain: ["inconsistent workouts", "confusing advice", "slow progress"],
    outcomes: ["more consistent workouts", "clearer fitness routine", "visible progress"],
    objections: ["fitness products feel gimmicky", "hard to stay consistent"],
    uspHints: ["simple to use", "fits into an existing routine"],
  },
  {
    industry: "saas",
    productFallback: "software platform",
    terms: ["saas", "software", "dashboard", "crm", "automation", "workflow", "analytics"],
    audience: "operators and founders who need faster workflows",
    pain: ["manual work", "tool overload", "slow reporting"],
    outcomes: ["faster decisions", "less manual work", "cleaner operating rhythm"],
    objections: ["another tool feels like extra work", "setup might take too long"],
    uspHints: ["quick setup", "fewer manual steps", "clearer visibility"],
  },
  {
    industry: "app",
    productFallback: "mobile app",
    terms: ["app", "mobile", "ios", "android", "download", "habit tracker", "fintech app"],
    audience: "mobile-first users who want a simpler way to get the job done",
    pain: ["too many steps", "forgetting tasks", "clunky apps"],
    outcomes: ["faster action", "better habit formation", "less friction"],
    objections: ["app fatigue", "privacy concerns", "it may not be worth downloading"],
    uspHints: ["fast onboarding", "clean mobile experience", "useful every day"],
  },
  {
    industry: "finance",
    productFallback: "finance product",
    terms: ["finance", "invest", "insurance", "credit", "loan", "tax", "wealth", "money"],
    audience: "professionals who want clearer financial decisions",
    pain: ["confusing financial choices", "fear of making mistakes", "hidden fees"],
    outcomes: ["more confidence with money", "clear next step", "better planning"],
    objections: ["finance products feel risky", "too much jargon", "trust concerns"],
    uspHints: ["simple explanation", "transparent process", "made for first-time users"],
  },
  {
    industry: "beauty",
    productFallback: "beauty product",
    terms: ["makeup", "beauty", "hair", "lipstick", "foundation", "fragrance", "perfume"],
    audience: "beauty shoppers who want a product that feels easy to use in real life",
    pain: [
      "products look different online",
      "hard to choose shade or finish",
      "wasteful purchases",
    ],
    outcomes: ["better everyday look", "easy application", "confidence before going out"],
    objections: ["will it suit me", "is it worth the price", "will it last"],
    uspHints: ["real-life finish", "easy application", "premium feel"],
  },
  {
    industry: "ecommerce",
    productFallback: "consumer product",
    terms: ["shop", "store", "d2c", "ecommerce", "product", "brand", "shipping"],
    audience: "online shoppers comparing similar products",
    pain: ["hard to know what is worth buying", "too many options", "quality uncertainty"],
    outcomes: ["confident purchase", "clear value", "less buyer regret"],
    objections: ["is this legit", "will quality match the photos", "shipping concerns"],
    uspHints: ["clear value", "strong product experience", "built for everyday use"],
  },
];

export const DEFAULT_PERSONAS: CreatorPersona[] = [
  {
    persona_name: "Indian Female 22",
    age: 22,
    gender: "female",
    accent: "urban Indian English with light Hinglish warmth",
    energy: "bright, curious, quick",
    trust_level: "peer recommendation",
    creator_style: "UGC lifestyle creator",
    speaking_speed: "medium fast",
    tone: "casual, expressive, slightly playful",
    appearance: "young Indian creator, natural makeup, clean casual outfit",
  },
  {
    persona_name: "Indian Female 28",
    age: 28,
    gender: "female",
    accent: "clear Indian English",
    energy: "calm, confident, relatable",
    trust_level: "trusted everyday buyer",
    creator_style: "testimonial creator",
    speaking_speed: "medium",
    tone: "honest, specific, practical",
    appearance: "Indian creator in a modern apartment, minimal jewelry, polished casual look",
  },
  {
    persona_name: "Indian Female 35",
    age: 35,
    gender: "female",
    accent: "neutral Indian English",
    energy: "grounded, assured",
    trust_level: "experienced reviewer",
    creator_style: "premium product reviewer",
    speaking_speed: "medium",
    tone: "warm, discerning, low hype",
    appearance: "Indian woman with elegant everyday styling and natural lighting",
  },
  {
    persona_name: "Indian Mom 40",
    age: 40,
    gender: "female",
    accent: "warm Indian English with conversational Hindi touches",
    energy: "caring, direct",
    trust_level: "family-first recommender",
    creator_style: "mom creator",
    speaking_speed: "medium",
    tone: "protective, practical, reassuring",
    appearance: "Indian mother in a bright home, simple kurta or comfortable casual outfit",
  },
  {
    persona_name: "Indian Male Tech Reviewer",
    age: 30,
    gender: "male",
    accent: "Indian English tech-review cadence",
    energy: "sharp, analytical",
    trust_level: "expert reviewer",
    creator_style: "tech reviewer",
    speaking_speed: "medium fast",
    tone: "clear, skeptical, evidence-led",
    appearance: "Indian male creator at a clean desk setup with laptop and product props",
  },
  {
    persona_name: "Startup Founder",
    age: 32,
    gender: "any",
    accent: "global Indian startup English",
    energy: "focused, candid",
    trust_level: "builder credibility",
    creator_style: "founder-led talking head",
    speaking_speed: "medium",
    tone: "plainspoken, mission-driven, specific",
    appearance: "founder in a minimal office or coworking space, laptop nearby",
  },
  {
    persona_name: "Finance Creator",
    age: 29,
    gender: "any",
    accent: "clear Indian English",
    energy: "composed, precise",
    trust_level: "educator credibility",
    creator_style: "finance explainer",
    speaking_speed: "medium",
    tone: "trustworthy, jargon-free, practical",
    appearance: "creator in a tidy office, neutral outfit, confident eye contact",
  },
  {
    persona_name: "Beauty Creator",
    age: 26,
    gender: "female",
    accent: "urban Indian English",
    energy: "expressive, polished",
    trust_level: "beauty enthusiast",
    creator_style: "beauty UGC creator",
    speaking_speed: "medium fast",
    tone: "friendly, observant, product-aware",
    appearance: "beauty creator near a mirror or vanity, fresh makeup, product visible",
  },
  {
    persona_name: "Fitness Creator",
    age: 27,
    gender: "any",
    accent: "energetic Indian English",
    energy: "active, motivating",
    trust_level: "routine-based credibility",
    creator_style: "fitness UGC creator",
    speaking_speed: "medium fast",
    tone: "direct, encouraging, no-nonsense",
    appearance: "creator in gym wear, real gym or home workout background",
  },
  {
    persona_name: "College Student",
    age: 20,
    gender: "any",
    accent: "casual Indian English with Gen Z phrasing",
    energy: "fast, spontaneous",
    trust_level: "peer discovery",
    creator_style: "student creator",
    speaking_speed: "fast",
    tone: "casual, funny, very native to short-form video",
    appearance: "student in hostel or campus-style room with casual clothes",
  },
  {
    persona_name: "Corporate Professional",
    age: 31,
    gender: "any",
    accent: "neutral professional Indian English",
    energy: "calm, efficient",
    trust_level: "professional credibility",
    creator_style: "workday lifestyle creator",
    speaking_speed: "medium",
    tone: "practical, composed, honest",
    appearance: "professional in workwear at desk, commute, or apartment setting",
  },
  {
    persona_name: "Luxury Lifestyle Creator",
    age: 34,
    gender: "any",
    accent: "polished global English",
    energy: "controlled, aspirational",
    trust_level: "taste-maker credibility",
    creator_style: "luxury lifestyle creator",
    speaking_speed: "slow medium",
    tone: "understated, premium, sensory",
    appearance: "elegant creator in a refined apartment or boutique setting",
  },
];

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    preset_name: "Selfie Handheld",
    camera_type: "handheld selfie",
    lens: "35mm",
    movement: "natural hand shake",
    framing: "medium closeup",
    focus: "face tracking",
    best_for: ["UGC Testimonial", "Talking Head", "TikTok Hook", "Problem Solution"],
  },
  {
    preset_name: "Walk And Talk",
    camera_type: "phone camera, front-facing",
    lens: "28mm",
    movement: "walk forward with soft stabilization",
    framing: "medium shot with headroom",
    focus: "face tracking with background motion",
    best_for: ["Lifestyle Ad", "Founder Story", "Talking Head"],
  },
  {
    preset_name: "Product Closeup",
    camera_type: "rear phone camera closeup",
    lens: "50mm macro feel",
    movement: "slow push in",
    framing: "tight product closeup with hands",
    focus: "product and label priority",
    best_for: ["Product Demo", "Feature Highlight", "Before After"],
  },
  {
    preset_name: "Orbit Shot",
    camera_type: "stabilized phone camera",
    lens: "35mm",
    movement: "gentle orbit around subject",
    framing: "medium product and creator frame",
    focus: "subject lock with slight background parallax",
    best_for: ["Cinematic Commercial", "Lifestyle Ad"],
  },
  {
    preset_name: "Table Review",
    camera_type: "phone on mini tripod",
    lens: "35mm",
    movement: "minimal tripod drift",
    framing: "waist-up creator at table",
    focus: "face then product rack focus",
    best_for: ["Product Demo", "Comparison Ad", "UGC Testimonial"],
  },
  {
    preset_name: "Unboxing Shot",
    camera_type: "handheld rear phone camera",
    lens: "35mm",
    movement: "subtle handheld reveal",
    framing: "hands and product packaging",
    focus: "hands and packaging details",
    best_for: ["Product Unboxing", "Product Demo"],
  },
  {
    preset_name: "Desk Setup",
    camera_type: "tripod phone camera",
    lens: "35mm",
    movement: "slow push in toward laptop",
    framing: "creator plus desktop workspace",
    focus: "screen and creator alternation",
    best_for: ["SaaS Explainer", "App Demo", "Feature Highlight"],
  },
  {
    preset_name: "Car Dashboard",
    camera_type: "phone mounted on dashboard",
    lens: "28mm",
    movement: "slight road vibration",
    framing: "creator speaking from driver's seat while parked",
    focus: "face tracking",
    best_for: ["Talking Head", "Story Framework"],
  },
  {
    preset_name: "Mirror Selfie",
    camera_type: "phone mirror selfie",
    lens: "26mm phone lens",
    movement: "small hand adjustment",
    framing: "half body mirror frame",
    focus: "creator reflection and product in hand",
    best_for: ["Beauty Creator", "Lifestyle Ad", "Before After"],
  },
  {
    preset_name: "Gym Selfie",
    camera_type: "handheld gym selfie",
    lens: "28mm",
    movement: "natural handheld movement",
    framing: "medium closeup in gym",
    focus: "face tracking with active background",
    best_for: ["Fitness Creator", "Product Demo"],
  },
  {
    preset_name: "Street Interview",
    camera_type: "handheld street interviewer camera",
    lens: "35mm",
    movement: "subtle shoulder movement",
    framing: "two-person medium closeup",
    focus: "speaker tracking",
    best_for: ["Street Interview", "Social Proof"],
  },
  {
    preset_name: "Laptop Setup",
    camera_type: "tripod camera beside laptop",
    lens: "35mm",
    movement: "screen-side push in",
    framing: "laptop, hands, and creator reaction",
    focus: "screen content then face",
    best_for: ["App Demo", "SaaS Explainer", "Feature Highlight"],
  },
  {
    preset_name: "Overhead Product Shot",
    camera_type: "top-down phone camera",
    lens: "35mm",
    movement: "table rotation",
    framing: "overhead product layout",
    focus: "product surface and hand interaction",
    best_for: ["Product Demo", "Product Unboxing", "Comparison Ad"],
  },
  {
    preset_name: "POV Creator",
    camera_type: "creator POV phone camera",
    lens: "28mm",
    movement: "camera follow",
    framing: "hands, product, and environment from creator perspective",
    focus: "action tracking",
    best_for: ["Lifestyle Ad", "Product Demo", "Voiceover B-roll"],
  },
];

const MOTION_LIBRARY = [
  "slow push in",
  "slight pan left",
  "slight pan right",
  "subtle shake",
  "gentle orbit",
  "walk forward",
  "walk backward",
  "camera follow",
  "crash zoom",
  "pull back reveal",
  "table rotation",
] as const;

const DEFAULT_NEGATIVES = [
  "extra fingers",
  "deformed hands",
  "floating objects",
  "warped products",
  "robotic expression",
  "plastic skin",
  "uncanny smile",
  "oversaturated image",
  "over sharpened image",
  "incorrect lip sync",
  "text artifacts",
];

export const MODEL_ROUTING_TABLE = {
  ugc_talking_head: "Higgsfield",
  product_cinematic: "Veo",
  character_consistency: "Kling",
  fast_generation: "Minimax",
  realism: "Seedance",
  motion_heavy: "Wan",
} as const;

export const HIGGSFIELD_API_CONTRACTS = {
  "/api/intelligence": {
    method: "POST",
    body: "HiggsfieldUserInput",
    returns: "PromptIntelligence + BriefIntelligence + ContentStrategy + IntentDetection",
  },
  "/api/persona": {
    method: "POST",
    body: "HiggsfieldUserInput with optional customPersona",
    returns: "selected CreatorPersona and default persona catalog",
  },
  "/api/hooks": {
    method: "POST",
    body: "HiggsfieldUserInput",
    returns: "ranked HookVariation[]",
  },
  "/api/script": {
    method: "POST",
    body: "HiggsfieldUserInput with optional scriptFramework/scriptStyle",
    returns: "HiggsfieldScript and 15/30/45/60 second scripts",
  },
  "/api/camera": {
    method: "POST",
    body: "HiggsfieldUserInput",
    returns: "selected CameraPreset and preset catalog",
  },
  "/api/motion": {
    method: "POST",
    body: "HiggsfieldUserInput with optional motionIntensity",
    returns: "MotionDirective",
  },
  "/api/compiler": {
    method: "POST",
    body: "HiggsfieldUserInput",
    returns: "complete compiled Higgsfield prompt, model route, negatives, and variations",
  },
  "/api/render": {
    method: "POST",
    body: "HiggsfieldUserInput",
    returns: "saved prompt-ready render history row and compiled prompt",
  },
  "/api/generate-variations": {
    method: "POST",
    body: "HiggsfieldUserInput",
    returns: "20 UGCVariation records by default",
  },
} as const;

function clean(input: string | undefined | null) {
  return (input ?? "").replace(/\s+/g, " ").trim();
}

function slugify(input: string) {
  return clean(input)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function titleCase(input: string) {
  return clean(input)
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function textIncludes(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function unique(values: string[], limit = 8) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values.map(clean).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= limit) break;
  }
  return out;
}

function sentenceList(values: string[]) {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

function scoreHash(input: string, min = 0, max = 9) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 9973;
  }
  return min + (hash % (max - min + 1));
}

function extractAfterPatterns(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1].replace(/[.?!].*$/, ""));
  }
  return "";
}

function splitSignals(text: string) {
  return unique(
    text
      .split(/[\n,;|]+/)
      .map((part) => part.replace(/^\s*[-*]\s*/, "").trim())
      .filter((part) => part.length > 2),
    12,
  );
}

function inferIndustryRule(text: string) {
  const lower = text.toLowerCase();
  const matched = INDUSTRY_RULES.map((rule) => ({
    rule,
    score: rule.terms.reduce((sum, term) => sum + (lower.includes(term) ? 1 : 0), 0),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return matched[0]?.rule ?? INDUSTRY_RULES[7];
}

function inferProductName(input: HiggsfieldUserInput, rule: IndustryRule) {
  const explicit = clean(input.productName);
  if (explicit) return explicit;

  const combined = `${input.brief}\n${input.voiceNoteTranscript ?? ""}`;
  const direct = extractAfterPatterns(combined, [
    /\b(?:my|our|the)\s+([a-z0-9][a-z0-9\s+-]{2,80}?(?:serum|supplement|app|software|cream|oil|tool|platform|course|drink|bar|kit|mask|cleanser|sunscreen|tracker|product))\b/i,
    /\b(?:we sell|selling|launching|promote|advertise|ad for|create an ad for)\s+(?:my|our|the)?\s*([a-z0-9][a-z0-9\s+-]{2,80})/i,
    /\bproduct(?:\s*\/\s*brand)?\s*:\s*([^\n.]+)/i,
  ]);
  if (direct) return titleCase(direct);

  for (const term of rule.terms) {
    if (combined.toLowerCase().includes(term)) return titleCase(term);
  }

  return titleCase(rule.productFallback);
}

function inferGoal(text: string): HiggsfieldGoal {
  const lower = text.toLowerCase();
  if (/\b(install|download|app install)\b/.test(lower)) return "app_installs";
  if (/\b(lead|demo call|book a call|consultation|trial)\b/.test(lower)) return "lead_generation";
  if (/\b(learn|explain|educate|awareness|top funnel)\b/.test(lower)) return "education";
  if (/\b(retarget|remarket|again|already visited)\b/.test(lower)) return "retargeting";
  if (/\b(sale|buy|conversion|purchase|order|shop|ad|offer)\b/.test(lower)) return "conversions";
  return "conversions";
}

function inferPlatform(text: string, explicit?: HiggsfieldPlatform): HiggsfieldPlatform {
  if (explicit) return explicit;
  const lower = text.toLowerCase();
  if (lower.includes("tiktok")) return "tiktok";
  if (lower.includes("youtube") || lower.includes("shorts")) return "youtube_shorts";
  if (lower.includes("facebook")) return "facebook_reels";
  if (lower.includes("linkedin")) return "linkedin";
  if (/\bx\b|twitter/.test(lower)) return "x";
  return "instagram_reels";
}

function inferDuration(text: string, explicit?: number) {
  if (explicit) return explicit;
  const match = text.match(/\b(\d{1,2})\s*(?:sec|second|seconds|s)\b/i);
  if (match) return clamp(Number(match[1]), 6, 90);
  if (/linkedin|explainer|founder story/i.test(text)) return 45;
  if (/tiktok|hook/i.test(text)) return 15;
  return 20;
}

function inferCountry(text: string, explicit?: string) {
  const value = clean(explicit);
  if (value) return value.toLowerCase();
  const lower = text.toLowerCase();
  if (/\b(us|usa|united states|america)\b/.test(lower)) return "united states";
  if (/\b(uk|united kingdom|london)\b/.test(lower)) return "united kingdom";
  if (/\buae|dubai\b/.test(lower)) return "uae";
  if (/\bindia|indian|hinglish|hindi|mumbai|delhi|bangalore|pune\b/.test(lower)) return "india";
  return "india";
}

function inferLanguage(text: string, country: string) {
  const lower = text.toLowerCase();
  if (lower.includes("hinglish")) return "Hinglish";
  if (lower.includes("hindi")) return "Hindi";
  if (country.toLowerCase() === "india") return "English with optional light Hinglish";
  return "English";
}

function inferTargetAudience(input: HiggsfieldUserInput, rule: IndustryRule) {
  const explicit = clean(input.targetAudience);
  if (explicit) return explicit;
  const combined = `${input.brief}\n${input.voiceNoteTranscript ?? ""}`;
  const detected = extractAfterPatterns(combined, [
    /\btarget audience(?:\s+is|\s*:)?\s*([^\n.]+)/i,
    /\bfor\s+([a-z0-9][a-z0-9\s,-]{8,120}?(?:professionals|moms|students|founders|creators|women|men|buyers|teams|users|people|parents|marketers|operators))/i,
    /\bpeople\s+(?:between|aged)\s+([^\n.]+)/i,
  ]);
  return detected || rule.audience;
}

function extractFeaturesAndUsp(input: HiggsfieldUserInput, rule: IndustryRule) {
  const combined = `${input.brief}\n${input.voiceNoteTranscript ?? ""}`;
  const explicit = input.featureList?.map(clean).filter(Boolean) ?? [];
  const lines = splitSignals(combined).filter((part) =>
    /\b(helps|without|no |usp|benefit|feature|main|faster|better|easier|less|more|with )\b/i.test(
      part,
    ),
  );
  const featureCandidates = unique([...explicit, ...lines, ...rule.uspHints], 8);
  const usp = unique(
    [
      extractAfterPatterns(combined, [
        /\b(?:main usp|usp|unique selling point)\s*(?:is|:)\s*([^\n.]+)/i,
        /\bwithout\s+([^\n.]+)/i,
        /\bno\s+([a-z0-9\s-]{3,80})/i,
      ]),
      ...featureCandidates.filter((item) =>
        /\b(no|without|only|first|unique|unlike)\b/i.test(item),
      ),
      ...rule.uspHints,
    ],
    4,
  );
  return { features: featureCandidates, usp };
}

export function detectIntent(
  input: HiggsfieldUserInput,
  intelligence?: PromptIntelligence,
): IntentDetection {
  const text =
    `${input.brief} ${input.adFormat ?? ""} ${intelligence?.product_type ?? ""}`.toLowerCase();
  const rules: Array<{
    category: IntentCategory;
    subcategory: string;
    terms: string[];
    base: number;
  }> = [
    {
      category: "Product Unboxing",
      subcategory: "creator unboxes product and reacts",
      terms: ["unbox", "unboxing", "package reveal"],
      base: 0.91,
    },
    {
      category: "Before After",
      subcategory: "visible transformation",
      terms: ["before after", "before/after", "transformation", "results"],
      base: 0.9,
    },
    {
      category: "Founder Story",
      subcategory: "founder-led origin and mission",
      terms: ["founder", "why we built", "our story", "mission"],
      base: 0.89,
    },
    {
      category: "Comparison Ad",
      subcategory: "old way versus new way",
      terms: ["compare", "comparison", "versus", "vs", "alternative"],
      base: 0.88,
    },
    {
      category: "Street Interview",
      subcategory: "social proof interview",
      terms: ["street interview", "ask people", "public reaction"],
      base: 0.87,
    },
    {
      category: "App Demo",
      subcategory: "screen-led app walkthrough",
      terms: ["app demo", "mobile app", "download", "screen recording"],
      base: 0.86,
    },
    {
      category: "SaaS Explainer",
      subcategory: "workflow explanation",
      terms: ["saas", "software", "dashboard", "workflow", "crm"],
      base: 0.86,
    },
    {
      category: "Product Demo",
      subcategory: "show product in use",
      terms: ["demo", "show how", "how to use", "product in use"],
      base: 0.85,
    },
    {
      category: "Cinematic Commercial",
      subcategory: "polished product film",
      terms: ["cinematic", "commercial", "premium ad", "luxury film"],
      base: 0.84,
    },
    {
      category: "Voiceover B-roll",
      subcategory: "creator voice over product/lifestyle shots",
      terms: ["voiceover", "b-roll", "broll"],
      base: 0.83,
    },
    {
      category: "TikTok Hook",
      subcategory: "fast first-second hook",
      terms: ["tiktok", "viral hook", "hook only"],
      base: 0.82,
    },
    {
      category: "Lifestyle Ad",
      subcategory: "product in daily routine",
      terms: ["lifestyle", "routine", "day in my life"],
      base: 0.81,
    },
    {
      category: "Feature Highlight",
      subcategory: "one strong feature",
      terms: ["feature", "highlight", "benefit"],
      base: 0.8,
    },
    {
      category: "Problem Solution",
      subcategory: "pain point into product answer",
      terms: ["problem", "solution", "pain", "struggle"],
      base: 0.79,
    },
    {
      category: "AI Influencer",
      subcategory: "synthetic creator ad",
      terms: ["ai influencer", "virtual influencer"],
      base: 0.78,
    },
    {
      category: "Talking Head",
      subcategory: "direct camera explanation",
      terms: ["talking head", "direct to camera"],
      base: 0.77,
    },
  ];

  for (const rule of rules) {
    const matches = rule.terms.filter((term) => text.includes(term)).length;
    if (matches > 0) {
      return {
        category: rule.category,
        subcategory: rule.subcategory,
        confidence: Number(clamp(rule.base + matches * 0.03, 0, 0.97).toFixed(2)),
      };
    }
  }

  if (/\bad\b|buy|shop|sale|conversion/.test(text)) {
    return {
      category: "UGC Testimonial",
      subcategory: "creator recommendation ad",
      confidence: 0.82,
    };
  }

  return {
    category: "Problem Solution",
    subcategory: "pain point into product answer",
    confidence: 0.72,
  };
}

export function analyzeBrief(inputRaw: unknown): BriefIntelligence {
  const input = HiggsfieldUserInputSchema.parse(inputRaw);
  const combined = clean(`${input.brief}\n${input.voiceNoteTranscript ?? ""}`);
  const rule = inferIndustryRule(combined);
  const productName = inferProductName(input, rule);
  const targetAudience = inferTargetAudience(input, rule);
  const { features, usp } = extractFeaturesAndUsp(input, rule);
  const sourceInputs = [
    input.productUrl ? "product_url" : "",
    input.websiteUrl ? "website_url" : "",
    input.landingPageUrl ? "landing_page_url" : "",
    input.competitorUrl ? "competitor_url" : "",
    input.productImages?.length ? "product_images" : "",
    input.voiceNoteTranscript ? "voice_note_transcript" : "",
    input.featureList?.length ? "feature_list" : "",
    "raw_brief",
  ].filter(Boolean);

  return {
    industry: rule.industry,
    product_type: slugify(productName || rule.productFallback),
    target_audience: targetAudience,
    pain_points: unique([...extractPainSignals(combined), ...rule.pain], 5),
    desired_outcomes: unique([...extractOutcomeSignals(combined), ...rule.outcomes], 5),
    objections: unique([...extractObjectionSignals(combined), ...rule.objections], 4),
    usp: unique(usp, 4),
    features,
    proof_points: extractProofSignals(combined),
    source_inputs: sourceInputs,
  };
}

function extractPainSignals(text: string) {
  const signals: string[] = [];
  const lower = text.toLowerCase();
  const painWords = [
    ["cannot sleep", "cannot sleep"],
    ["can't sleep", "cannot sleep"],
    ["stress", "stress"],
    ["groggy", "waking tired"],
    ["dull", "dull skin"],
    ["acne", "breakouts"],
    ["manual", "manual work"],
    ["confusing", "confusing choices"],
  ];
  for (const [term, signal] of painWords) {
    if (lower.includes(term)) signals.push(signal);
  }
  const explicit = extractAfterPatterns(text, [/\bpain points?\s*(?:are|:)\s*([^\n.]+)/i]);
  if (explicit) signals.push(...splitSignals(explicit));
  return unique(signals, 5);
}

function extractOutcomeSignals(text: string) {
  const signals: string[] = [];
  const lower = text.toLowerCase();
  const outcomeWords = [
    ["fall asleep faster", "fall asleep faster"],
    ["better sleep", "better sleep"],
    ["energy", "more energy"],
    ["focus", "improved focus"],
    ["glow", "healthy glow"],
    ["brighter", "brighter looking skin"],
    ["save time", "save time"],
    ["faster", "faster outcome"],
  ];
  for (const [term, signal] of outcomeWords) {
    if (lower.includes(term)) signals.push(signal);
  }
  const explicit = extractAfterPatterns(text, [/\bdesired outcomes?\s*(?:are|:)\s*([^\n.]+)/i]);
  if (explicit) signals.push(...splitSignals(explicit));
  return unique(signals, 5);
}

function extractObjectionSignals(text: string) {
  const lower = text.toLowerCase();
  const signals: string[] = [];
  if (lower.includes("side effect")) signals.push("fear of side effects");
  if (lower.includes("expensive") || lower.includes("price")) signals.push("price sensitivity");
  if (lower.includes("trust")) signals.push("trust concerns");
  if (lower.includes("don't work") || lower.includes("doesn't work")) {
    signals.push("doubt that it will work");
  }
  const explicit = extractAfterPatterns(text, [/\bobjections?\s*(?:are|:)\s*([^\n.]+)/i]);
  if (explicit) signals.push(...splitSignals(explicit));
  return unique(signals, 4);
}

function extractProofSignals(text: string) {
  const signals: string[] = [];
  const lower = text.toLowerCase();
  if (/\bclinically|dermatologist|lab tested|certified|patent|study|tested\b/.test(lower)) {
    signals.push("mention only verified proof from the brief or source material");
  }
  if (/\breviews?|ratings?|testimonial|customers?\b/.test(lower)) {
    signals.push("customer experience or review proof");
  }
  if (/\bno melatonin|non melatonin\b/.test(lower)) signals.push("non-melatonin positioning");
  return unique(signals, 4);
}

export function classifyPrompt(inputRaw: unknown): PromptIntelligence {
  const input = HiggsfieldUserInputSchema.parse(inputRaw);
  const combined = clean(`${input.brief}\n${input.voiceNoteTranscript ?? ""}`);
  const rule = inferIndustryRule(combined);
  const productName = inferProductName(input, rule);
  const country = inferCountry(combined, input.country);
  const platform = inferPlatform(combined, input.platform);
  const { features, usp } = extractFeaturesAndUsp(input, rule);

  return {
    industry: rule.industry,
    product_type: slugify(productName || rule.productFallback),
    product_name: productName,
    target_audience: inferTargetAudience(input, rule),
    marketing_goal: input.goal ?? inferGoal(combined),
    platform,
    country,
    creator_style: clean(input.creatorStyle) || "ugc",
    duration: inferDuration(combined, input.duration),
    ad_format: clean(input.adFormat) || inferAdFormat(combined),
    language: inferLanguage(combined, country),
    key_features: features,
    pain_points: unique([...extractPainSignals(combined), ...rule.pain], 5),
    desired_outcomes: unique([...extractOutcomeSignals(combined), ...rule.outcomes], 5),
    objections: unique([...extractObjectionSignals(combined), ...rule.objections], 4),
    usp: unique(usp, 4),
    proof_points: extractProofSignals(combined),
    urls: {
      product: input.productUrl || undefined,
      website: input.websiteUrl || undefined,
      landingPage: input.landingPageUrl || undefined,
      competitor: input.competitorUrl || undefined,
    },
  };
}

function inferAdFormat(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("testimonial")) return "testimonial";
  if (lower.includes("unboxing")) return "unboxing";
  if (lower.includes("demo")) return "product_demo";
  if (lower.includes("comparison") || lower.includes(" vs ")) return "comparison";
  if (lower.includes("founder")) return "founder_story";
  if (lower.includes("before") && lower.includes("after")) return "before_after";
  return "testimonial";
}

export function buildContentStrategy(
  inputRaw: unknown,
  intelligence = classifyPrompt(inputRaw),
  intent = detectIntent(HiggsfieldUserInputSchema.parse(inputRaw), intelligence),
): ContentStrategy {
  const lower = HiggsfieldUserInputSchema.parse(inputRaw).brief.toLowerCase();
  const awareness_stage: ContentStrategy["awareness_stage"] =
    lower.includes("competitor") || intent.category === "Comparison Ad"
      ? "solution aware"
      : lower.includes("buy") || lower.includes("offer")
        ? "product aware"
        : lower.includes("problem") || intelligence.pain_points.length > 0
          ? "problem aware"
          : "unaware";

  const funnel_stage: ContentStrategy["funnel_stage"] =
    intelligence.marketing_goal === "conversions" || awareness_stage === "product aware"
      ? "bottom funnel"
      : awareness_stage === "problem aware" || awareness_stage === "solution aware"
        ? "middle funnel"
        : "top funnel";

  return {
    awareness_stage,
    funnel_stage,
    goal: intelligence.marketing_goal,
    recommended_format: intent.category.toLowerCase(),
    recommended_platform: intelligence.platform,
    recommended_persona: selectPersona(
      HiggsfieldUserInputSchema.parse(inputRaw),
      intelligence,
      intent,
    ).persona_name,
    rationale: `Use ${intent.category.toLowerCase()} because the brief is ${awareness_stage} and the goal is ${intelligence.marketing_goal.replace(/_/g, " ")}.`,
  };
}

export function selectPersona(
  inputRaw: unknown,
  intelligence = classifyPrompt(inputRaw),
  intent = detectIntent(HiggsfieldUserInputSchema.parse(inputRaw), intelligence),
): CreatorPersona {
  const input = HiggsfieldUserInputSchema.parse(inputRaw);
  if (input.customPersona?.persona_name) {
    return CreatorPersonaSchema.parse({
      ...DEFAULT_PERSONAS[1],
      ...input.customPersona,
    });
  }

  const lowerAudience = intelligence.target_audience.toLowerCase();
  const find = (name: string) =>
    DEFAULT_PERSONAS.find((persona) => persona.persona_name === name) ?? DEFAULT_PERSONAS[1];

  if (intelligence.industry === "skincare" || intelligence.industry === "beauty") {
    if (lowerAudience.includes("mom")) return find("Indian Mom 40");
    if (input.scriptStyle === "luxury" || input.scriptStyle === "premium") {
      return find("Luxury Lifestyle Creator");
    }
    return find("Beauty Creator");
  }
  if (intelligence.industry === "fitness") return find("Fitness Creator");
  if (intelligence.industry === "finance") return find("Finance Creator");
  if (intelligence.industry === "saas") {
    return intent.category === "Founder Story"
      ? find("Startup Founder")
      : find("Corporate Professional");
  }
  if (intelligence.industry === "app") return find("Indian Male Tech Reviewer");
  if (lowerAudience.includes("student") || lowerAudience.includes("college"))
    return find("College Student");
  if (intent.category === "Founder Story") return find("Startup Founder");
  return find("Indian Female 28");
}

export function generateHooks(
  inputRaw: unknown,
  intelligence = classifyPrompt(inputRaw),
  intent = detectIntent(HiggsfieldUserInputSchema.parse(inputRaw), intelligence),
): HookVariation[] {
  const input = HiggsfieldUserInputSchema.parse(inputRaw);
  const product = intelligence.product_name;
  const pain = intelligence.pain_points[0] ?? "this problem";
  const outcome = intelligence.desired_outcomes[0] ?? "a better result";
  const objection = intelligence.objections[0] ?? "I was skeptical too";
  const audience = intelligence.target_audience;
  const platform = intelligence.platform;
  const hooks: Array<
    Omit<HookVariation, "id" | "platform" | "predicted_engagement_score" | "reason"> & {
      base: number;
      reason: string;
    }
  > = [
    {
      category: "Curiosity",
      hook: `I tried ${product} for one very specific reason, and it was not what I expected.`,
      base: 84,
      reason: "Curiosity gap with product specificity.",
    },
    {
      category: "Shock",
      hook: `I did not realize ${pain} was the reason my routine kept failing.`,
      base: 81,
      reason: "Pattern interrupt tied to the core pain point.",
    },
    {
      category: "Comparison",
      hook: `I used to do it the old way. ${product} feels way simpler.`,
      base: 80,
      reason: "Old way versus new way makes the value clear fast.",
    },
    {
      category: "Social Proof",
      hook: `A friend told me to try ${product}, and honestly I get the hype now.`,
      base: 78,
      reason: "Peer referral feels creator-native.",
    },
    {
      category: "Problem",
      hook: `If you are dealing with ${pain}, this is the part nobody explains clearly.`,
      base: 86,
      reason: "Pain-led hook fits UGC and conversion ads.",
    },
    {
      category: "POV",
      hook: `POV: you want ${outcome}, but you do not want a ten-step routine.`,
      base: 83,
      reason: "Platform-native POV format.",
    },
    {
      category: "Story",
      hook: `I was not even looking for ${product}, but after dealing with ${pain}, I gave it a shot.`,
      base: 85,
      reason: "Human discovery story avoids hard-sell tone.",
    },
    {
      category: "Question",
      hook: `Would you try ${product} if it helped with ${pain} without making your routine harder?`,
      base: 77,
      reason: "Direct qualification question.",
    },
    {
      category: "Founder",
      hook: `We built ${product} because ${audience} kept running into the same problem.`,
      base: intent.category === "Founder Story" ? 88 : 74,
      reason: "Founder framing works when the brief needs trust.",
    },
    {
      category: "Statistic",
      hook: `${audience} keep missing this one detail before they buy ${product}.`,
      base: 75,
      reason: "Statistic-style setup without inventing unsupported numbers.",
    },
  ];

  const platformBoost: Partial<Record<HiggsfieldPlatform, Partial<Record<HookCategory, number>>>> =
    {
      instagram_reels: { Problem: 5, Story: 5, POV: 4, Curiosity: 4 },
      tiktok: { Shock: 7, POV: 7, Curiosity: 5 },
      youtube_shorts: { Problem: 5, Question: 4, Comparison: 4 },
      facebook_reels: { "Social Proof": 5, Story: 4, Problem: 4 },
      linkedin: { Founder: 7, Problem: 4, Comparison: 4 },
      x: { Shock: 5, Statistic: 5, Question: 4 },
    };

  return hooks
    .map((hook) => {
      const score =
        hook.base +
        (platformBoost[platform]?.[hook.category] ?? 0) +
        scoreHash(`${hook.hook}:${input.brief}`, 0, 5);
      return {
        id: slugify(`${hook.category}-${hook.hook}`).slice(0, 56),
        category: hook.category,
        platform,
        hook: humanize(hook.hook),
        predicted_engagement_score: clamp(score, 1, 99),
        reason: hook.reason,
      };
    })
    .sort((a, b) => b.predicted_engagement_score - a.predicted_engagement_score);
}

function humanize(text: string) {
  return text
    .replace(/\bdo not\b/gi, "don't")
    .replace(/\bI am\b/g, "I'm")
    .replace(/\bwas not\b/g, "wasn't")
    .replace(/\bit is\b/g, "it's")
    .replace(/\bFurthermore\b/gi, "Honestly")
    .replace(/\bMoreover\b/gi, "Turns out")
    .replace(/\bRevolutionary\b/gi, "The weird part was")
    .trim();
}

function pickFramework(intent: IntentDetection, input: HiggsfieldUserInput): ScriptFramework {
  if (input.scriptFramework) return input.scriptFramework;
  if (intent.category === "Founder Story") return "Founder Story";
  if (intent.category === "Comparison Ad") return "Comparison Ad";
  if (intent.category === "UGC Testimonial") return "Creator Testimonial";
  if (intent.category === "TikTok Hook" || intent.category === "Problem Solution") return "PAS";
  if (intent.category === "Product Demo" || intent.category === "Feature Highlight") return "AIDA";
  return "Story Framework";
}

function styleCue(style: HiggsfieldScriptStyle) {
  const cues: Record<HiggsfieldScriptStyle, string> = {
    conversational: "keep it casual and specific",
    soft_sell: "sound low-pressure and helpful",
    aggressive_sales: "make the CTA direct without sounding fake",
    educational: "teach one clear thing before selling",
    luxury: "use understated, sensory language",
    premium: "sound polished and selective",
    humorous: "add a light self-aware line",
  };
  return cues[style];
}

export function generateScript(
  inputRaw: unknown,
  options: {
    intelligence?: PromptIntelligence;
    intent?: IntentDetection;
    persona?: CreatorPersona;
    hook?: HookVariation;
    duration?: number;
    cta?: string;
  } = {},
): HiggsfieldScript {
  const input = HiggsfieldUserInputSchema.parse(inputRaw);
  const intelligence = options.intelligence ?? classifyPrompt(input);
  const intent = options.intent ?? detectIntent(input, intelligence);
  const persona = options.persona ?? selectPersona(input, intelligence, intent);
  const selectedHook = options.hook ?? generateHooks(input, intelligence, intent)[0];
  const style = input.scriptStyle ?? "conversational";
  const framework = pickFramework(intent, input);
  const duration = options.duration ?? intelligence.duration;
  const product = intelligence.product_name;
  const pain = intelligence.pain_points[0] ?? "the same annoying problem";
  const outcome = intelligence.desired_outcomes[0] ?? "a smoother result";
  const usp =
    intelligence.usp[0] ?? intelligence.key_features[0] ?? "it fits into a normal routine";
  const objection = intelligence.objections[0] ?? "I was skeptical too";
  const cta = options.cta ?? generateCtas(input, intelligence)[0];

  const frameworkLine = frameworkScriptLine(framework, product, pain, outcome, usp, objection);
  const hook = selectedHook.hook;
  const problem = humanize(frameworkLine.problem);
  const solution = humanize(frameworkLine.solution);
  const proof = humanize(frameworkLine.proof);
  const finalCta = humanize(cta);
  const personaTexture =
    persona.speaking_speed.includes("fast") || duration <= 15
      ? "quick cuts, short sentences"
      : "natural pauses, one thought at a time";

  const full = humanize(
    [
      hook,
      problem,
      solution,
      proof,
      finalCta,
      `Delivery note: ${styleCue(style)}, ${personaTexture}.`,
    ].join(" "),
  );

  return {
    framework,
    style,
    hook,
    problem,
    solution,
    proof,
    cta: finalCta,
    full_script: fitScriptToDuration(full, duration),
    duration_seconds: duration,
  };
}

function frameworkScriptLine(
  framework: ScriptFramework,
  product: string,
  pain: string,
  outcome: string,
  usp: string,
  objection: string,
) {
  const map: Record<ScriptFramework, { problem: string; solution: string; proof: string }> = {
    PAS: {
      problem: `The annoying part is ${pain}, and most people only notice it after wasting time on random fixes.`,
      solution: `That is why ${product} caught my attention: ${usp}.`,
      proof: `What made it feel believable was how simple the experience felt in a normal day.`,
    },
    AIDA: {
      problem: `${pain} sounds small until it keeps showing up every day.`,
      solution: `${product} gives you a clearer path to ${outcome} because ${usp}.`,
      proof: `The part I would point out first is the experience, not some over-the-top claim.`,
    },
    "Story Framework": {
      problem: `I kept running into ${pain}, and honestly I thought it was just part of the routine.`,
      solution: `Then I tried ${product} because ${usp}.`,
      proof: `It did not feel like a dramatic life change. It just made the next step easier, which is the point.`,
    },
    "Creator Testimonial": {
      problem: `I had already tried a few things for ${pain}, so ${objection}.`,
      solution: `${product} felt different because ${usp}.`,
      proof: `The first thing I noticed was that it fit into my day without making it complicated.`,
    },
    "Founder Story": {
      problem: `We kept hearing the same thing from people dealing with ${pain}.`,
      solution: `So we built ${product} around one simple idea: ${usp}.`,
      proof: `The mission is not to make another loud product. It is to make ${outcome} easier to reach.`,
    },
    "Comparison Ad": {
      problem: `The old way of dealing with ${pain} usually means more steps, more guessing, and more frustration.`,
      solution: `${product} is the newer way: ${usp}.`,
      proof: `Side by side, the biggest difference is how much easier it feels to keep using.`,
    },
  };
  return map[framework];
}

function fitScriptToDuration(script: string, duration: number) {
  if (duration <= 15) {
    return script
      .replace(/ Delivery note:.*$/, "")
      .split(/(?<=[.!?])\s+/)
      .slice(0, 4)
      .join(" ");
  }
  if (duration <= 30) return script.replace(/ Delivery note:.*$/, "");
  if (duration <= 45) return script;
  return `${script} Add one real product-in-hand moment before the CTA so the video does not feel like a voiceover pasted onto random b-roll.`;
}

export function generateCtas(inputRaw: unknown, intelligence = classifyPrompt(inputRaw)) {
  const input = HiggsfieldUserInputSchema.parse(inputRaw);
  const lower = input.brief.toLowerCase();
  const product = intelligence.product_name;
  const platform = intelligence.platform;
  if (lower.includes("book a call")) {
    return [
      "Book a call if you want to see if this fits you.",
      "Send this to the person handling your next purchase.",
    ];
  }
  if (platform === "linkedin") {
    return [
      `Try ${product} if this is a problem your team is solving right now.`,
      "Comment 'demo' and I will send the next step.",
    ];
  }
  if (intelligence.marketing_goal === "app_installs") {
    return [
      `Download ${product} and try it once today.`,
      "Install it from the link and see if it fits your routine.",
    ];
  }
  return [
    `Tap the link and check out ${product}.`,
    `If you have been dealing with this, ${product} is worth a look.`,
  ];
}

export function generateMultiDurationScripts(
  inputRaw: unknown,
  intelligence = classifyPrompt(inputRaw),
  intent = detectIntent(HiggsfieldUserInputSchema.parse(inputRaw), intelligence),
): MultiDurationScripts {
  const hooks = generateHooks(inputRaw, intelligence, intent);
  const ctas = generateCtas(inputRaw, intelligence);
  return {
    short_script: generateScript(inputRaw, {
      intelligence,
      intent,
      hook: hooks[0],
      duration: 15,
      cta: ctas[0],
    }).full_script,
    medium_script: generateScript(inputRaw, {
      intelligence,
      intent,
      hook: hooks[1] ?? hooks[0],
      duration: 30,
      cta: ctas[0],
    }).full_script,
    long_script: generateScript(inputRaw, {
      intelligence,
      intent,
      hook: hooks[2] ?? hooks[0],
      duration: 45,
      cta: ctas[1] ?? ctas[0],
    }).full_script,
    extended_script: generateScript(inputRaw, {
      intelligence,
      intent,
      hook: hooks[3] ?? hooks[0],
      duration: 60,
      cta: ctas[1] ?? ctas[0],
    }).full_script,
    hook_variations: hooks,
    cta_variations: ctas,
  };
}

export function selectCamera(
  inputRaw: unknown,
  intelligence = classifyPrompt(inputRaw),
  intent = detectIntent(HiggsfieldUserInputSchema.parse(inputRaw), intelligence),
): CameraPreset {
  const text =
    `${HiggsfieldUserInputSchema.parse(inputRaw).brief} ${intelligence.ad_format}`.toLowerCase();
  if (text.includes("mirror")) return preset("Mirror Selfie");
  if (text.includes("gym")) return preset("Gym Selfie");
  if (text.includes("car")) return preset("Car Dashboard");
  if (intent.category === "Product Unboxing") return preset("Unboxing Shot");
  if (intent.category === "Product Demo" || intent.category === "Feature Highlight") {
    return intelligence.industry === "saas" || intelligence.industry === "app"
      ? preset("Laptop Setup")
      : preset("Product Closeup");
  }
  if (intent.category === "Comparison Ad") return preset("Table Review");
  if (intent.category === "Street Interview") return preset("Street Interview");
  if (intent.category === "Lifestyle Ad") return preset("POV Creator");
  if (intent.category === "Cinematic Commercial") return preset("Orbit Shot");
  if (intent.category === "SaaS Explainer" || intent.category === "App Demo")
    return preset("Desk Setup");
  if (intent.category === "Founder Story") return preset("Walk And Talk");
  return preset("Selfie Handheld");
}

function preset(name: string) {
  return CAMERA_PRESETS.find((camera) => camera.preset_name === name) ?? CAMERA_PRESETS[0];
}

export function generateMotion(
  inputRaw: unknown,
  camera = selectCamera(inputRaw),
  intent = detectIntent(HiggsfieldUserInputSchema.parse(inputRaw), classifyPrompt(inputRaw)),
): MotionDirective {
  const input = HiggsfieldUserInputSchema.parse(inputRaw);
  const intensity = input.motionIntensity ?? inferMotionIntensity(input, intent);
  const presetMotion =
    camera.preset_name === "Product Closeup"
      ? "slow push in"
      : camera.preset_name === "Orbit Shot"
        ? "gentle orbit"
        : camera.preset_name === "Walk And Talk"
          ? "walk forward"
          : camera.preset_name === "Overhead Product Shot"
            ? "table rotation"
            : camera.preset_name === "POV Creator"
              ? "camera follow"
              : "subtle shake";
  const secondary =
    intensity === "aggressive"
      ? intent.category === "TikTok Hook"
        ? "crash zoom"
        : "pull back reveal"
      : presetMotion === "subtle shake"
        ? "slight pan left"
        : "slight pan right";

  return {
    primary_motion: presetMotion,
    secondary_motion: secondary,
    intensity,
    instructions: `${presetMotion} with ${intensity} intensity, preserve natural UGC camera imperfections, avoid robotic stabilization, keep the product and face readable.`,
    timing:
      intensity === "aggressive"
        ? "strong movement in first 1.5 seconds, then settle for script clarity"
        : "micro movement throughout, with a small emphasis on the hook and CTA",
  };
}

function inferMotionIntensity(
  input: HiggsfieldUserInput,
  intent: IntentDetection,
): MotionIntensity {
  if ((input.motionComplexity ?? 0) > 72) return "aggressive";
  if (intent.category === "TikTok Hook" || intent.category === "Cinematic Commercial")
    return "medium";
  return "subtle";
}

export function generateNegativePrompt(
  inputRaw: unknown,
  modelRoute?: ModelRoute,
  intent?: IntentDetection,
): NegativePromptSet {
  const input = HiggsfieldUserInputSchema.parse(inputRaw);
  const intelligence = classifyPrompt(input);
  const resolvedIntent = intent ?? detectIntent(input, intelligence);
  const model = modelRoute?.primary_model ?? "Higgsfield";
  const extras = [
    resolvedIntent.category.includes("Talking") || resolvedIntent.category.includes("UGC")
      ? "dead eyes"
      : "",
    intelligence.industry === "skincare" || intelligence.industry === "beauty"
      ? "unrealistic poreless face"
      : "",
    intelligence.product_name ? "wrong product label" : "",
    model === "Higgsfield" ? "cinematic movie look" : "",
    model === "Kling" ? "identity drift" : "",
    model === "Wan" ? "motion blur on face" : "",
  ];
  const items = unique([...DEFAULT_NEGATIVES, ...extras], 18);
  return {
    model,
    items,
    prompt: items.join(", "),
  };
}

export function routeModel(
  inputRaw: unknown,
  intelligence = classifyPrompt(inputRaw),
  intent = detectIntent(HiggsfieldUserInputSchema.parse(inputRaw), intelligence),
): ModelRoute {
  const input = HiggsfieldUserInputSchema.parse(inputRaw);
  const durationScore = clamp(intelligence.duration, 0, 90);
  const realism = input.realismRequirement ?? (intent.category === "UGC Testimonial" ? 86 : 70);
  const consistency = input.creatorConsistency ?? (intent.category === "AI Influencer" ? 90 : 62);
  const motion = input.motionComplexity ?? (intent.category === "Cinematic Commercial" ? 82 : 48);
  const latencyFast = input.latency === "fast" ? 92 : input.latency === "quality" ? 20 : 50;
  const cinematic = intent.category === "Cinematic Commercial" ? 92 : 30;
  const ugc = ["UGC Testimonial", "Talking Head", "Problem Solution", "TikTok Hook"].includes(
    intent.category,
  )
    ? 94
    : 64;

  const scores = {
    ugc_talking_head: ugc + (intelligence.creator_style.includes("ugc") ? 5 : 0),
    product_cinematic: cinematic + (input.budget === "premium" ? 8 : 0),
    character_consistency: consistency + (durationScore > 45 ? 8 : 0),
    fast_generation: latencyFast + (input.budget === "low" ? 8 : 0),
    realism,
    motion_heavy: motion,
  };

  if (input.modelOverride) {
    return {
      primary_model: input.modelOverride,
      fallback_model: "Higgsfield",
      route_key: "ugc_talking_head",
      reason: "Manual model override was provided.",
      scores,
    };
  }

  const routeKey = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "ugc_talking_head") as ModelRoute["route_key"];
  const primary = MODEL_ROUTING_TABLE[routeKey];
  const fallback =
    primary === "Higgsfield"
      ? "Seedance"
      : routeKey === "fast_generation"
        ? "Higgsfield"
        : "Higgsfield";

  return {
    primary_model: primary,
    fallback_model: fallback,
    route_key: routeKey,
    reason: modelRouteReason(routeKey, intent, intelligence),
    scores,
  };
}

function modelRouteReason(
  routeKey: ModelRoute["route_key"],
  intent: IntentDetection,
  intelligence: PromptIntelligence,
) {
  const map: Record<ModelRoute["route_key"], string> = {
    ugc_talking_head: `Higgsfield is best for ${intent.category.toLowerCase()}, creator ads, natural faces, and UGC pacing.`,
    product_cinematic:
      "Veo is preferred because this brief asks for a more cinematic product film.",
    character_consistency:
      "Kling is preferred because creator consistency is the highest routing constraint.",
    fast_generation: "Minimax is preferred because latency and budget are prioritized.",
    realism: `Seedance is preferred because realism is more important than stylized movement for this ${intelligence.industry} ad.`,
    motion_heavy: "Wan is preferred because motion complexity is the dominant requirement.",
  };
  return map[routeKey];
}

function yamlSection(label: keyof HiggsfieldPromptSchema, value: string) {
  return `${label}:\n${value.trim()}`;
}

export function compilePromptFromParts({
  input,
  intelligence,
  intent,
  persona,
  script,
  camera,
  motion,
  negativePrompt,
  modelRoute,
}: {
  input: HiggsfieldUserInput;
  intelligence: PromptIntelligence;
  intent: IntentDetection;
  persona: CreatorPersona;
  script: HiggsfieldScript;
  camera: CameraPreset;
  motion: MotionDirective;
  negativePrompt: NegativePromptSet;
  modelRoute: ModelRoute;
}): CompiledHiggsfieldPrompt {
  const scene = sceneDirection(input, intelligence, camera);
  const productAction =
    intent.category === "Product Demo" || intent.category === "Product Unboxing"
      ? "showing the product in hand, demonstrating texture, size, packaging, and real usage"
      : "speaking naturally while holding or referencing the product";
  const outputPlatform = platformLabel(intelligence.platform);
  const schema: HiggsfieldPromptSchema = {
    SUBJECT: `${persona.age} year old ${persona.gender} creator, ${persona.appearance}, ${persona.accent}, ${persona.creator_style}`,
    PRODUCT: `${intelligence.product_name} (${titleCase(intelligence.product_type)}), industry: ${intelligence.industry}, USP: ${sentenceList(intelligence.usp)}`,
    ACTION: productAction,
    SCENE: scene,
    CAMERA: `${camera.camera_type}\n${camera.lens} lens\n${camera.framing}\n${camera.focus}\nmovement: ${camera.movement}`,
    EXPRESSION: `${persona.energy} energy, ${persona.tone}, natural micro-expressions, believable eye contact, no overacting`,
    STYLE: `authentic UGC, real creator vibe, ${outputPlatform} native, ${script.style.replace(/_/g, " ")} sell, not corporate, not overproduced`,
    LIGHTING: lightingDirection(intelligence, input),
    SCRIPT: [
      `Hook: ${script.hook}`,
      `Problem: ${script.problem}`,
      `Solution: ${script.solution}`,
      `Proof: ${script.proof}`,
      `CTA: ${script.cta}`,
    ].join("\n"),
    MOTION: `${motion.instructions}\nTiming: ${motion.timing}`,
    AUDIO: `${persona.speaking_speed} speaking speed, clean creator voice, light room tone, accurate lip sync, platform-native delivery`,
    OUTPUT: `9:16 vertical\n${intelligence.duration} seconds\n${outputPlatform}\nmodel route: ${modelRoute.primary_model}`,
    NEGATIVE: negativePrompt.prompt,
  };

  return {
    schema,
    yaml: (Object.keys(schema) as Array<keyof HiggsfieldPromptSchema>)
      .map((key) => yamlSection(key, schema[key]))
      .join("\n\n"),
    json: {
      schema,
      model_route: modelRoute,
      intelligence,
      intent,
      persona,
      camera,
      motion,
      script,
      source_urls: intelligence.urls,
      original_brief: input.brief,
    },
  };
}

function sceneDirection(
  input: HiggsfieldUserInput,
  intelligence: PromptIntelligence,
  camera: CameraPreset,
) {
  const lower = input.brief.toLowerCase();
  if (
    lower.includes("bedroom") ||
    intelligence.industry === "skincare" ||
    intelligence.industry === "beauty"
  ) {
    return "modern apartment bedroom or vanity corner with natural daylight, product visible, lived-in but clean";
  }
  if (intelligence.industry === "fitness") {
    return "real gym or home workout corner, practical lighting, not a glossy fitness commercial";
  }
  if (intelligence.industry === "saas" || intelligence.industry === "app") {
    return "clean desk setup with laptop or phone visible, realistic workday environment";
  }
  if (camera.preset_name === "Street Interview")
    return "busy but readable street background with natural ambient movement";
  return "modern apartment or workday environment with natural light and authentic creator setup";
}

function lightingDirection(intelligence: PromptIntelligence, input: HiggsfieldUserInput) {
  if (input.scriptStyle === "luxury" || input.scriptStyle === "premium") {
    return "soft premium daylight, controlled highlights, realistic skin texture";
  }
  if (intelligence.industry === "skincare" || intelligence.industry === "beauty") {
    return "natural daylight from window, soft skin tones, no plastic smoothing";
  }
  return "natural available light, realistic phone-camera exposure, no studio-perfect gloss";
}

function platformLabel(platform: HiggsfieldPlatform) {
  const map: Record<HiggsfieldPlatform, string> = {
    instagram_reels: "Instagram Reel",
    tiktok: "TikTok",
    youtube_shorts: "YouTube Short",
    facebook_reels: "Facebook Reel",
    linkedin: "LinkedIn Video Ad",
    x: "X short video",
  };
  return map[platform];
}

export function compileHiggsfieldPrompt(inputRaw: unknown): HiggsfieldGenerationResult {
  const input = HiggsfieldUserInputSchema.parse(inputRaw);
  const intelligence = classifyPrompt(input);
  const briefIntelligence = analyzeBrief(input);
  const intent = detectIntent(input, intelligence);
  const persona = selectPersona(input, intelligence, intent);
  const hooks = generateHooks(input, intelligence, intent);
  const selectedHook = hooks[0];
  const script = generateScript(input, { intelligence, intent, persona, hook: selectedHook });
  const scripts = generateMultiDurationScripts(input, intelligence, intent);
  const camera = selectCamera(input, intelligence, intent);
  const motion = generateMotion(input, camera, intent);
  const modelRoute = routeModel(input, intelligence, intent);
  const negativePrompt = generateNegativePrompt(input, modelRoute, intent);
  const prompt = compilePromptFromParts({
    input,
    intelligence,
    intent,
    persona,
    script,
    camera,
    motion,
    negativePrompt,
    modelRoute,
  });
  const contentStrategy = buildContentStrategy(input, intelligence, intent);
  const variations = generateUGCVariations(input, input.variationCount ?? 20, {
    intelligence,
    intent,
    baseHooks: hooks,
  });

  return {
    engine_version: "higgsfield-ugc-v1",
    input,
    intelligence,
    brief_intelligence: briefIntelligence,
    content_strategy: contentStrategy,
    intent,
    persona,
    hooks,
    selected_hook: selectedHook,
    script,
    scripts,
    camera,
    motion,
    negative_prompt: negativePrompt,
    model_route: modelRoute,
    prompt,
    variations,
    api_contracts: HIGGSFIELD_API_CONTRACTS,
  };
}

export function generateUGCVariations(
  inputRaw: unknown,
  count = 20,
  context: {
    intelligence?: PromptIntelligence;
    intent?: IntentDetection;
    baseHooks?: HookVariation[];
  } = {},
): UGCVariation[] {
  const input = HiggsfieldUserInputSchema.parse(inputRaw);
  const intelligence = context.intelligence ?? classifyPrompt(input);
  const intent = context.intent ?? detectIntent(input, intelligence);
  const hooks = (context.baseHooks ?? generateHooks(input, intelligence, intent)).slice(0, 4);
  const personas = chooseVariationPersonas(intelligence, intent);
  const cameras = chooseVariationCameras(input, intelligence, intent);
  const ctas = generateCtas(input, intelligence).slice(0, 2);
  const max = clamp(count, 1, 20);
  const variations: UGCVariation[] = [];

  for (let pIndex = 0; pIndex < personas.length; pIndex += 1) {
    for (let hIndex = 0; hIndex < hooks.length; hIndex += 1) {
      if (variations.length >= max) break;
      const persona = personas[pIndex];
      const hook = hooks[hIndex];
      const camera = cameras[variations.length % cameras.length];
      const cta = ctas[variations.length % ctas.length] ?? generateCtas(input, intelligence)[0];
      const motion = generateMotion(
        { ...input, motionIntensity: input.motionIntensity },
        camera,
        intent,
      );
      const modelRoute = routeModel(input, intelligence, intent);
      const negativePrompt = generateNegativePrompt(input, modelRoute, intent);
      const script = generateScript(input, {
        intelligence,
        intent,
        persona,
        hook,
        cta,
        duration: intelligence.duration,
      });
      const prompt = compilePromptFromParts({
        input,
        intelligence,
        intent,
        persona,
        script,
        camera,
        motion,
        negativePrompt,
        modelRoute,
      });
      const score = clamp(
        Math.round(
          hook.predicted_engagement_score * 0.55 +
            (persona.trust_level.includes("expert") ? 15 : 12) +
            scoreHash(`${persona.persona_name}:${camera.preset_name}:${hook.hook}`, 0, 12),
        ),
        1,
        99,
      );

      variations.push({
        id: `ugc-${String(variations.length + 1).padStart(2, "0")}-${slugify(persona.persona_name)}-${slugify(hook.category)}`,
        title: `${persona.persona_name} / ${hook.category} / ${camera.preset_name}`,
        persona,
        hook,
        camera,
        motion,
        cta,
        script,
        model_route: modelRoute,
        prompt,
        score,
      });
    }
  }

  return variations;
}

function chooseVariationPersonas(intelligence: PromptIntelligence, intent: IntentDetection) {
  const preferred = [
    selectPersonaFromName("Indian Female 28"),
    selectPersonaFromName("Beauty Creator"),
    selectPersonaFromName("Corporate Professional"),
    selectPersonaFromName("Indian Female 35"),
    selectPersonaFromName("College Student"),
  ];

  if (intelligence.industry === "fitness") {
    return uniquePersonas([
      selectPersonaFromName("Fitness Creator"),
      selectPersonaFromName("College Student"),
      selectPersonaFromName("Corporate Professional"),
      selectPersonaFromName("Indian Female 28"),
      selectPersonaFromName("Indian Male Tech Reviewer"),
    ]);
  }
  if (intelligence.industry === "saas" || intelligence.industry === "app") {
    return uniquePersonas([
      selectPersonaFromName("Startup Founder"),
      selectPersonaFromName("Corporate Professional"),
      selectPersonaFromName("Indian Male Tech Reviewer"),
      selectPersonaFromName("Finance Creator"),
      selectPersonaFromName("College Student"),
    ]);
  }
  if (intelligence.industry === "finance") {
    return uniquePersonas([
      selectPersonaFromName("Finance Creator"),
      selectPersonaFromName("Corporate Professional"),
      selectPersonaFromName("Startup Founder"),
      selectPersonaFromName("Indian Male Tech Reviewer"),
      selectPersonaFromName("Indian Female 35"),
    ]);
  }
  if (intent.category === "Founder Story") {
    return uniquePersonas([
      selectPersonaFromName("Startup Founder"),
      selectPersonaFromName("Corporate Professional"),
      selectPersonaFromName("Indian Female 35"),
      selectPersonaFromName("Indian Male Tech Reviewer"),
      selectPersonaFromName("Luxury Lifestyle Creator"),
    ]);
  }

  return uniquePersonas(preferred);
}

function selectPersonaFromName(name: string) {
  return DEFAULT_PERSONAS.find((persona) => persona.persona_name === name) ?? DEFAULT_PERSONAS[1];
}

function uniquePersonas(personas: CreatorPersona[]) {
  const seen = new Set<string>();
  return personas
    .filter((persona) => {
      if (seen.has(persona.persona_name)) return false;
      seen.add(persona.persona_name);
      return true;
    })
    .slice(0, 5);
}

function chooseVariationCameras(
  input: HiggsfieldUserInput,
  intelligence: PromptIntelligence,
  intent: IntentDetection,
) {
  const primary = selectCamera(input, intelligence, intent);
  const options = [
    primary,
    intent.category === "Product Unboxing"
      ? preset("Overhead Product Shot")
      : preset("Selfie Handheld"),
    intelligence.industry === "saas" || intelligence.industry === "app"
      ? preset("Laptop Setup")
      : preset("Table Review"),
  ];
  const seen = new Set<string>();
  return options.filter((camera) => {
    if (seen.has(camera.preset_name)) return false;
    seen.add(camera.preset_name);
    return true;
  });
}

export function buildHiggsfieldResponseSummary(result: HiggsfieldGenerationResult) {
  return {
    product: result.intelligence.product_name,
    industry: result.intelligence.industry,
    category: result.intent.category,
    persona: result.persona.persona_name,
    model: result.model_route.primary_model,
    duration: result.intelligence.duration,
    variations: result.variations.length,
  };
}
