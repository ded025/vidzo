import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listPresets, createPreset, deletePreset, activatePreset } from "@/lib/threads.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sliders, Trash2, CheckCircle2, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat/presets")({
  component: PresetsPage,
});

const VOICES = [
  { id: "9BWtsMINqrJLrRacOk9x", name: "Aria" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian" },
];

function PresetsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listPresets);
  const create = useServerFn(createPreset);
  const del = useServerFn(deletePreset);
  const act = useServerFn(activatePreset);
  const q = useQuery({ queryKey: ["presets"], queryFn: () => list() });

  const [form, setForm] = useState({
    name: "",
    niche: "",
    audience: "",
    tone: "",
    language: "Hinglish",
    default_voice_id: VOICES[0].id,
    default_voice_name: VOICES[0].name,
  });

  const createMut = useMutation({
    mutationFn: async () => create({ data: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["presets"] });
      toast.success("Preset saved");
      setForm({ ...form, name: "" });
    },
  });
  const delMut = useMutation({
    mutationFn: async (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["presets"] }),
  });
  const actMut = useMutation({
    mutationFn: async (id: string) => act({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["presets"] });
      toast.success("Active preset updated");
    },
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brand & voice presets</h1>
            <p className="text-muted-foreground text-sm">
              The active preset is injected into every new chat as standing instructions.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Create a preset</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My Gym Brand"
              />
            </div>
            <div>
              <Label>Niche</Label>
              <Input
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value })}
                placeholder="Fitness, gym, nutrition"
              />
            </div>
            <div>
              <Label>Audience</Label>
              <Input
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                placeholder="Indian men 18–30, beginner lifters"
              />
            </div>
            <div>
              <Label>Tone</Label>
              <Input
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value })}
                placeholder="Blunt, science-backed, no-nonsense"
              />
            </div>
            <div>
              <Label>Language</Label>
              <Input
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              />
            </div>
            <div>
              <Label>Default ElevenLabs voice</Label>
              <select
                value={form.default_voice_id}
                onChange={(e) => {
                  const v = VOICES.find((x) => x.id === e.target.value)!;
                  setForm({ ...form, default_voice_id: v.id, default_voice_name: v.name });
                }}
                className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => createMut.mutate()}
              disabled={!form.name.trim() || createMut.isPending}
            >
              <Plus className="h-4 w-4 mr-1" /> Save preset
            </Button>
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Your presets</h2>
          {q.isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          <div className="space-y-2">
            {(q.data ?? []).map((p) => (
              <div
                key={p.id}
                className={`rounded-xl border p-4 flex items-start justify-between gap-3 ${
                  p.is_active ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{p.name}</h3>
                    {p.is_active && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-primary inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground space-x-2">
                    {p.niche && <span>📌 {p.niche}</span>}
                    {p.audience && <span>👥 {p.audience}</span>}
                    {p.tone && <span>🎯 {p.tone}</span>}
                    {p.language && <span>🌐 {p.language}</span>}
                    {p.default_voice_name && <span>🎙️ {p.default_voice_name}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!p.is_active && (
                    <Button size="sm" variant="ghost" onClick={() => actMut.mutate(p.id)}>
                      Activate
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => delMut.mutate(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {q.data && q.data.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No presets yet. Create one above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
