import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  AlertCircle,
  Camera,
  Check,
  Clipboard,
  Copy,
  Download,
  FileJson,
  Film,
  Gauge,
  History,
  Layers3,
  Loader2,
  MessageCircle,
  RefreshCw,
  Route,
  Settings2,
  Sparkles,
  Target,
  UserRound,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { listHiggsfieldRenderHistory } from "@/lib/higgsfield.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  HIGGSFIELD_BUDGETS,
  HIGGSFIELD_GOALS,
  HIGGSFIELD_LATENCIES,
  HIGGSFIELD_MOTION_INTENSITIES,
  HIGGSFIELD_PLATFORMS,
  HIGGSFIELD_SCRIPT_STYLES,
  type HiggsfieldGenerationResult,
  type HiggsfieldGoal,
  type HiggsfieldPlatform,
  type HiggsfieldScriptStyle,
  type HiggsfieldUserInput,
  type MotionIntensity,
  type UGCVariation,
} from "@/lib/higgsfield-prompt-engine";

type EngineFormState = {
  brief: string;
  productName: string;
  productUrl: string;
  websiteUrl: string;
  landingPageUrl: string;
  competitorUrl: string;
  featureList: string;
  voiceNoteTranscript: string;
  targetAudience: string;
  country: string;
  platform: HiggsfieldPlatform;
  duration: number;
  adFormat: string;
  creatorStyle: string;
  goal: HiggsfieldGoal;
  scriptStyle: HiggsfieldScriptStyle;
  motionIntensity: MotionIntensity;
  budget: (typeof HIGGSFIELD_BUDGETS)[number];
  latency: (typeof HIGGSFIELD_LATENCIES)[number];
  realismRequirement: number;
  creatorConsistency: number;
  motionComplexity: number;
  variationCount: number;
};

type RenderResponse = {
  status: string;
  render_history?: { id: string; created_at: string; persistence_errors?: string[] };
  result: HiggsfieldGenerationResult;
};

type VariationsResponse = {
  status: string;
  render_history?: { id: string; created_at: string; persistence_errors?: string[] };
  variations: UGCVariation[];
};

const PLATFORM_LABELS: Record<HiggsfieldPlatform, string> = {
  instagram_reels: "Instagram Reels",
  tiktok: "TikTok",
  youtube_shorts: "YouTube Shorts",
  facebook_reels: "Facebook Reels",
  linkedin: "LinkedIn",
  x: "X",
};

const GOAL_LABELS: Record<HiggsfieldGoal, string> = {
  conversions: "Conversions",
  awareness: "Awareness",
  lead_generation: "Lead generation",
  education: "Education",
  app_installs: "App installs",
  retargeting: "Retargeting",
};

const DEFAULT_FORM: EngineFormState = {
  brief:
    "Create an ad for my Vitamin C serum. It helps dull skin look brighter, feels lightweight, and is made for Indian women who want a simple morning routine.",
  productName: "Vitamin C Serum",
  productUrl: "",
  websiteUrl: "",
  landingPageUrl: "",
  competitorUrl: "",
  featureList: "lightweight texture\nbrightening routine\nnon-sticky finish",
  voiceNoteTranscript: "",
  targetAudience: "Indian women 22-35 who want glowing skin without a complicated routine",
  country: "india",
  platform: "instagram_reels",
  duration: 20,
  adFormat: "testimonial",
  creatorStyle: "ugc",
  goal: "conversions",
  scriptStyle: "conversational",
  motionIntensity: "subtle",
  budget: "standard",
  latency: "balanced",
  realismRequirement: 88,
  creatorConsistency: 64,
  motionComplexity: 42,
  variationCount: 20,
};

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function buildInput(form: EngineFormState): HiggsfieldUserInput {
  return {
    brief: form.brief.trim(),
    productName: form.productName.trim() || undefined,
    productUrl: normalizeUrl(form.productUrl),
    websiteUrl: normalizeUrl(form.websiteUrl),
    landingPageUrl: normalizeUrl(form.landingPageUrl),
    competitorUrl: normalizeUrl(form.competitorUrl),
    featureList: form.featureList
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean),
    voiceNoteTranscript: form.voiceNoteTranscript.trim() || undefined,
    targetAudience: form.targetAudience.trim() || undefined,
    country: form.country.trim() || undefined,
    platform: form.platform,
    duration: form.duration,
    adFormat: form.adFormat.trim() || undefined,
    creatorStyle: form.creatorStyle.trim() || undefined,
    goal: form.goal,
    scriptStyle: form.scriptStyle,
    motionIntensity: form.motionIntensity,
    budget: form.budget,
    latency: form.latency,
    realismRequirement: form.realismRequirement,
    creatorConsistency: form.creatorConsistency,
    motionComplexity: form.motionComplexity,
    variationCount: form.variationCount,
  };
}

function getModelName(route: unknown) {
  if (route && typeof route === "object" && "primary_model" in route) {
    return String((route as { primary_model?: unknown }).primary_model ?? "Higgsfield");
  }
  return "Higgsfield";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

async function getBearerToken() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session expired. Sign in again.");
  return token;
}

async function postEngine<T>(path: string, input: HiggsfieldUserInput): Promise<T> {
  const token = await getBearerToken();
  const response = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string; detail?: string })
    | null;
  if (!response.ok) {
    throw new Error(payload?.error || `Higgsfield API returned HTTP ${response.status}.`);
  }
  if (!payload) throw new Error("Higgsfield API returned an empty response.");
  return payload;
}

async function copyText(text: string, label: string) {
  await navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

function exportJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function GlassPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-card/70 shadow-[0_20px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition-all duration-200 dark:bg-white/[0.045]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function FieldBlock({
  id,
  label,
  children,
  detail,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  detail?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {label}
        </Label>
        {detail ? <span className="text-[11px] text-muted-foreground">{detail}</span> : null}
      </div>
      {children}
    </div>
  );
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  labels,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  labels?: Partial<Record<T, string>>;
  onChange: (value: T) => void;
}) {
  return (
    <FieldBlock id={id} label={label}>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger id={id} className="h-10 bg-background/70">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {labels?.[option] ?? option.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </FieldBlock>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/45 p-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="font-mono text-muted-foreground">
          {value}
          {suffix ?? ""}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(next[0] ?? value)}
      />
    </div>
  );
}

function MetricPill({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "default" | "pink" | "blue" | "yellow";
}) {
  const toneClass =
    tone === "pink"
      ? "text-[var(--vidzo-magenta)]"
      : tone === "blue"
        ? "text-[var(--vidzo-blue)]"
        : tone === "yellow"
          ? "text-[var(--vidzo-yellow)]"
          : "text-primary";
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-background/55 px-3 py-2">
      <Icon className={cn("size-4 shrink-0", toneClass)} />
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-foreground">{value}</span>
        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </span>
    </div>
  );
}

function PromptPreview({
  prompt,
  empty,
  loading,
}: {
  prompt?: string;
  empty: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }
  return (
    <ScrollArea className="h-[520px] rounded-b-2xl">
      <pre className="whitespace-pre-wrap p-4 font-mono text-[12px] leading-6 text-foreground/90">
        {prompt || empty}
      </pre>
    </ScrollArea>
  );
}

function AdvancedDrawer({
  form,
  setForm,
}: {
  form: EngineFormState;
  setForm: React.Dispatch<React.SetStateAction<EngineFormState>>;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="bg-background/60">
          <Settings2 data-icon="inline-start" />
          Advanced
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Advanced controls</SheetTitle>
          <SheetDescription>
            Tune routing, source context, and production constraints.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-5">
          <FieldBlock id="product-url" label="Product URL">
            <Input
              id="product-url"
              value={form.productUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, productUrl: event.target.value }))
              }
              placeholder="brand.com/product"
            />
          </FieldBlock>
          <FieldBlock id="website-url" label="Website URL">
            <Input
              id="website-url"
              value={form.websiteUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, websiteUrl: event.target.value }))
              }
              placeholder="brand.com"
            />
          </FieldBlock>
          <FieldBlock id="landing-url" label="Landing page URL">
            <Input
              id="landing-url"
              value={form.landingPageUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, landingPageUrl: event.target.value }))
              }
              placeholder="brand.com/offer"
            />
          </FieldBlock>
          <FieldBlock id="competitor-url" label="Competitor URL">
            <Input
              id="competitor-url"
              value={form.competitorUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, competitorUrl: event.target.value }))
              }
              placeholder="competitor.com/product"
            />
          </FieldBlock>
          <FieldBlock id="features" label="Feature list" detail="one per line">
            <Textarea
              id="features"
              value={form.featureList}
              onChange={(event) =>
                setForm((current) => ({ ...current, featureList: event.target.value }))
              }
              rows={4}
            />
          </FieldBlock>
          <FieldBlock id="voice-note" label="Voice note transcript">
            <Textarea
              id="voice-note"
              value={form.voiceNoteTranscript}
              onChange={(event) =>
                setForm((current) => ({ ...current, voiceNoteTranscript: event.target.value }))
              }
              rows={4}
              placeholder="Paste messy founder notes or transcript."
            />
          </FieldBlock>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              id="budget"
              label="Budget"
              value={form.budget}
              options={HIGGSFIELD_BUDGETS}
              onChange={(budget) => setForm((current) => ({ ...current, budget }))}
            />
            <SelectField
              id="latency"
              label="Latency"
              value={form.latency}
              options={HIGGSFIELD_LATENCIES}
              onChange={(latency) => setForm((current) => ({ ...current, latency }))}
            />
          </div>
          <SliderField
            label="Realism"
            value={form.realismRequirement}
            min={0}
            max={100}
            onChange={(realismRequirement) =>
              setForm((current) => ({ ...current, realismRequirement }))
            }
          />
          <SliderField
            label="Creator consistency"
            value={form.creatorConsistency}
            min={0}
            max={100}
            onChange={(creatorConsistency) =>
              setForm((current) => ({ ...current, creatorConsistency }))
            }
          />
          <SliderField
            label="Motion complexity"
            value={form.motionComplexity}
            min={0}
            max={100}
            onChange={(motionComplexity) =>
              setForm((current) => ({ ...current, motionComplexity }))
            }
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function HistoryRail({
  activeHistoryId,
  onPreview,
}: {
  activeHistoryId?: string | null;
  onPreview: (id: string, prompt: string) => void;
}) {
  const loadHistory = useServerFn(listHiggsfieldRenderHistory);
  const history = useQuery({
    queryKey: ["higgsfield-history"],
    queryFn: () => loadHistory(),
    retry: false,
  });

  return (
    <GlassPanel className="flex h-full min-h-[420px] flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">History</h2>
        </div>
        {history.isFetching ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-3">
          {history.isLoading ? (
            <>
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </>
          ) : history.isError ? (
            <div className="rounded-xl border border-border bg-background/50 p-3 text-xs text-muted-foreground">
              Apply the Higgsfield migration to enable saved history.
            </div>
          ) : (history.data ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No Higgsfield prompts yet.
            </div>
          ) : (
            (history.data ?? []).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPreview(item.id, item.compiled_prompt)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all duration-200 hover:border-primary/50 hover:bg-background/70",
                  activeHistoryId === item.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background/45",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {item.product_name}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {PLATFORM_LABELS[item.platform as HiggsfieldPlatform] ?? item.platform} /{" "}
                      {item.duration_seconds}s
                    </span>
                  </span>
                  <Badge variant="secondary" className="shrink-0">
                    {getModelName(item.model_route)}
                  </Badge>
                </div>
                <div className="mt-3 text-[11px] text-muted-foreground">
                  {formatDate(item.created_at)}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </GlassPanel>
  );
}

function ResultTabs({
  result,
  variations,
  selectedVariation,
  onSelectVariation,
}: {
  result: HiggsfieldGenerationResult | null;
  variations: UGCVariation[];
  selectedVariation: UGCVariation | null;
  onSelectVariation: (variation: UGCVariation | null) => void;
}) {
  if (!result) {
    return (
      <GlassPanel className="p-5">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Sparkles className="size-5 text-primary" />
          Generate a brief to see hooks, scripts, camera direction, routing, and variations.
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="overflow-hidden">
      <Tabs defaultValue="strategy">
        <div className="overflow-x-auto border-b border-border/70 px-4 pt-4">
          <TabsList>
            <TabsTrigger value="strategy">
              <Target className="size-4" />
              Strategy
            </TabsTrigger>
            <TabsTrigger value="script">
              <MessageCircle className="size-4" />
              Script
            </TabsTrigger>
            <TabsTrigger value="camera">
              <Camera className="size-4" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="variations">
              <Layers3 className="size-4" />
              Variations
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="strategy" className="m-0 p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricPill icon={Film} label="Intent" value={result.intent.category} tone="pink" />
            <MetricPill
              icon={UserRound}
              label="Persona"
              value={result.persona.persona_name}
              tone="blue"
            />
            <MetricPill
              icon={Route}
              label="Model"
              value={result.model_route.primary_model}
              tone="yellow"
            />
            <MetricPill
              icon={Gauge}
              label="Confidence"
              value={`${Math.round(result.intent.confidence * 100)}%`}
            />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr,1fr]">
            <div className="rounded-xl border border-border/70 bg-background/45 p-4">
              <h3 className="text-sm font-semibold">Brief intelligence</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  result.intelligence.industry,
                  result.intelligence.product_type,
                  result.content_strategy.awareness_stage,
                  result.content_strategy.funnel_stage,
                ].map((item) => (
                  <Badge key={item} variant="secondary">
                    {item.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Audience</dt>
                  <dd>{result.intelligence.target_audience}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">USP</dt>
                  <dd>{result.intelligence.usp.join(", ")}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Objections</dt>
                  <dd>{result.intelligence.objections.join(", ")}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/45 p-4">
              <h3 className="text-sm font-semibold">Ranked hooks</h3>
              <div className="mt-3 flex flex-col gap-2">
                {result.hooks.slice(0, 5).map((hook) => (
                  <div key={hook.id} className="rounded-lg border border-border/70 bg-card/50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline">{hook.category}</Badge>
                      <span className="text-xs font-semibold text-primary">
                        {hook.predicted_engagement_score}/100
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{hook.hook}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="script" className="m-0 p-4">
          <div className="grid gap-3 md:grid-cols-5">
            {[
              ["Hook", result.script.hook],
              ["Problem", result.script.problem],
              ["Solution", result.script.solution],
              ["Proof", result.script.proof],
              ["CTA", result.script.cta],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border/70 bg-background/45 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 text-sm leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-border/70 bg-background/45 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">{result.script.framework}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void copyText(result.script.full_script, "Script")}
              >
                <Copy data-icon="inline-start" />
                Copy
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7">{result.script.full_script}</p>
          </div>
        </TabsContent>

        <TabsContent value="camera" className="m-0 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-background/45 p-4">
              <Camera className="size-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold">{result.camera.preset_name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{result.camera.camera_type}</p>
              <Separator className="my-3" />
              <p className="text-xs text-muted-foreground">
                {result.camera.lens} / {result.camera.framing} / {result.camera.focus}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/45 p-4">
              <Activity className="size-5 text-[var(--vidzo-yellow)]" />
              <h3 className="mt-3 text-sm font-semibold">{result.motion.primary_motion}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{result.motion.instructions}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/45 p-4">
              <Route className="size-5 text-[var(--vidzo-blue)]" />
              <h3 className="mt-3 text-sm font-semibold">{result.model_route.primary_model}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{result.model_route.reason}</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border/70 bg-background/45 p-4">
            <h3 className="text-sm font-semibold">Negative prompt</h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {result.negative_prompt.prompt}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="variations" className="m-0 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">One product to twenty ads</h3>
              <p className="text-xs text-muted-foreground">
                {variations.length} unique persona, hook, camera, and CTA combinations.
              </p>
            </div>
            {selectedVariation ? (
              <Button variant="ghost" size="sm" onClick={() => onSelectVariation(null)}>
                Use primary
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {variations.map((variation) => (
              <button
                key={variation.id}
                type="button"
                onClick={() => onSelectVariation(variation)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60",
                  selectedVariation?.id === variation.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/45",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{variation.title}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {variation.persona.persona_name}
                    </span>
                  </span>
                  <Badge variant="secondary">{variation.score}</Badge>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed">{variation.hook.hook}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="outline">{variation.camera.preset_name}</Badge>
                  <Badge variant="outline">{variation.hook.category}</Badge>
                </div>
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </GlassPanel>
  );
}

export function HiggsfieldPromptEngine() {
  const [form, setForm] = useState<EngineFormState>(DEFAULT_FORM);
  const [result, setResult] = useState<HiggsfieldGenerationResult | null>(null);
  const [variations, setVariations] = useState<UGCVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<UGCVariation | null>(null);
  const [historyPreview, setHistoryPreview] = useState<{ id: string; prompt: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshingVariations, setIsRefreshingVariations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const input = useMemo(() => buildInput(form), [form]);
  const previewPrompt =
    selectedVariation?.prompt.yaml ?? result?.prompt.yaml ?? historyPreview?.prompt ?? "";
  const previewJson = selectedVariation?.prompt.json ?? result?.prompt.json ?? result;
  const canGenerate = form.brief.trim().length >= 3;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setError(null);
    setSelectedVariation(null);
    setHistoryPreview(null);
    try {
      const payload = await postEngine<RenderResponse>("/api/render", input);
      setResult(payload.result);
      setVariations(payload.result.variations);
      if (payload.render_history?.persistence_errors?.length) {
        toast.warning("Prompt generated, but some history rows were not saved.");
      } else {
        toast.success("Higgsfield prompt ready");
      }
      queryClient.invalidateQueries({ queryKey: ["higgsfield-history"] });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not generate prompt.";
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshVariations = async () => {
    if (!canGenerate) return;
    setIsRefreshingVariations(true);
    setError(null);
    try {
      const payload = await postEngine<VariationsResponse>("/api/generate-variations", input);
      setVariations(payload.variations);
      setSelectedVariation(payload.variations[0] ?? null);
      toast.success("20 variations refreshed");
      queryClient.invalidateQueries({ queryKey: ["higgsfield-history"] });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not generate variations.";
      setError(message);
      toast.error(message);
    } finally {
      setIsRefreshingVariations(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)))]">
      <div className="min-h-full px-3 py-4 sm:px-5 lg:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-cal text-2xl font-semibold tracking-normal sm:text-3xl">
                Higgsfield UGC Prompt Engine
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Brief to director-grade creator ad prompt.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AdvancedDrawer form={form} setForm={setForm} />
              <Button
                variant="outline"
                size="sm"
                className="bg-background/60"
                disabled={!previewPrompt}
                onClick={() => previewPrompt && void copyText(previewPrompt, "Prompt")}
              >
                <Copy data-icon="inline-start" />
                Copy prompt
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-background/60"
                disabled={!previewJson}
                onClick={() => previewJson && exportJson("higgsfield-prompt.json", previewJson)}
              >
                <FileJson data-icon="inline-start" />
                Export JSON
              </Button>
            </div>
          </header>

          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4" />
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)_300px]">
            <GlassPanel className="p-4">
              <div className="flex flex-col gap-4">
                <FieldBlock id="brief" label="Raw brief" detail={`${form.brief.length} chars`}>
                  <Textarea
                    id="brief"
                    value={form.brief}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, brief: event.target.value }))
                    }
                    rows={8}
                    className="resize-none bg-background/70 text-sm leading-6"
                  />
                </FieldBlock>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <FieldBlock id="product-name" label="Product name">
                    <Input
                      id="product-name"
                      value={form.productName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, productName: event.target.value }))
                      }
                      className="bg-background/70"
                    />
                  </FieldBlock>
                  <FieldBlock id="audience" label="Audience">
                    <Input
                      id="audience"
                      value={form.targetAudience}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, targetAudience: event.target.value }))
                      }
                      className="bg-background/70"
                    />
                  </FieldBlock>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    id="platform"
                    label="Platform"
                    value={form.platform}
                    options={HIGGSFIELD_PLATFORMS}
                    labels={PLATFORM_LABELS}
                    onChange={(platform) => setForm((current) => ({ ...current, platform }))}
                  />
                  <SelectField
                    id="goal"
                    label="Goal"
                    value={form.goal}
                    options={HIGGSFIELD_GOALS}
                    labels={GOAL_LABELS}
                    onChange={(goal) => setForm((current) => ({ ...current, goal }))}
                  />
                  <SelectField
                    id="script-style"
                    label="Script style"
                    value={form.scriptStyle}
                    options={HIGGSFIELD_SCRIPT_STYLES}
                    onChange={(scriptStyle) => setForm((current) => ({ ...current, scriptStyle }))}
                  />
                  <SelectField
                    id="motion-intensity"
                    label="Motion"
                    value={form.motionIntensity}
                    options={HIGGSFIELD_MOTION_INTENSITIES}
                    onChange={(motionIntensity) =>
                      setForm((current) => ({ ...current, motionIntensity }))
                    }
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldBlock id="country" label="Country">
                    <Input
                      id="country"
                      value={form.country}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, country: event.target.value }))
                      }
                      className="bg-background/70"
                    />
                  </FieldBlock>
                  <FieldBlock id="format" label="Ad format">
                    <Input
                      id="format"
                      value={form.adFormat}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, adFormat: event.target.value }))
                      }
                      className="bg-background/70"
                    />
                  </FieldBlock>
                </div>

                <SliderField
                  label="Duration"
                  value={form.duration}
                  min={6}
                  max={90}
                  suffix="s"
                  onChange={(duration) => setForm((current) => ({ ...current, duration }))}
                />

                <div className="rounded-xl border border-border/70 bg-background/45 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Variations
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {form.variationCount}
                    </span>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={String(form.variationCount)}
                    onValueChange={(value) =>
                      value && setForm((current) => ({ ...current, variationCount: Number(value) }))
                    }
                    className="justify-start"
                  >
                    {[4, 8, 12, 20].map((count) => (
                      <ToggleGroupItem key={count} value={String(count)} size="sm" className="px-3">
                        {count}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="flex-1 bg-gradient-to-r from-[var(--vidzo-magenta)] to-[var(--vidzo-blue)] text-white hover:opacity-95"
                    disabled={!canGenerate || isGenerating}
                    onClick={() => void handleGenerate()}
                  >
                    {isGenerating ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <Wand2 data-icon="inline-start" />
                    )}
                    Generate
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-background/60"
                    disabled={!canGenerate || isRefreshingVariations}
                    onClick={() => void handleRefreshVariations()}
                  >
                    {isRefreshingVariations ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <RefreshCw data-icon="inline-start" />
                    )}
                    20 ads
                  </Button>
                </div>
              </div>
            </GlassPanel>

            <main className="flex min-w-0 flex-col gap-4">
              <GlassPanel className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Clipboard className="size-4 text-primary" />
                    <h2 className="text-sm font-semibold">
                      {selectedVariation ? selectedVariation.title : "Compiled prompt"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {result ? (
                      <Badge variant="secondary">{result.model_route.primary_model}</Badge>
                    ) : null}
                    {previewPrompt ? (
                      <Badge variant="outline">
                        <Check className="mr-1 size-3" />
                        Ready
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <PromptPreview
                  prompt={previewPrompt}
                  empty="Generated Higgsfield prompt will appear here."
                  loading={isGenerating}
                />
              </GlassPanel>

              <ResultTabs
                result={result}
                variations={variations}
                selectedVariation={selectedVariation}
                onSelectVariation={setSelectedVariation}
              />
            </main>

            <HistoryRail
              activeHistoryId={historyPreview?.id ?? null}
              onPreview={(id, prompt) => {
                setHistoryPreview({ id, prompt });
                setSelectedVariation(null);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
