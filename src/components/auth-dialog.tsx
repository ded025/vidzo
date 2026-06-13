import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { VidzoLogo } from "./vidzo-logo";
import { Loader2 } from "lucide-react";

export function AuthDialog({
  open,
  onOpenChange,
  defaultMode = "signin",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultMode?: "signin" | "signup";
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const goToDashboard = async () => {
    onOpenChange(false);
    await new Promise((r) => setTimeout(r, 30));
    await navigate({ to: "/chat/dashboard" });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/chat/dashboard` },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Welcome to Vidzo!");
          await goToDashboard();
        } else {
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error(error.message); return; }
        if (data.session) {
          toast.success("Welcome back!");
          await goToDashboard();
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/chat/dashboard`,
      });
      if (result.error) {
        toast.error((result.error as Error)?.message ?? "Google sign-in failed");
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        toast.success("Welcome to Vidzo!");
        await goToDashboard();
        return;
      }
      if (result.redirected) return;
      toast.error("Sign-in completed but session not found. Please try again.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Override bg-card (warm off-white in light mode) with pure white.
        We scope this to light mode only via the CSS variable trick:
        - In light mode: #ffffff
        - In dark mode: falls back to bg-card (dark surface) via the class
        The [&]:bg-white class is added alongside bg-card; because Tailwind
        uses the same specificity, we use an inline style with a media-query
        equivalent via a CSS class defined in styles.css instead.
        Cleanest approach: pass className that overrides just the bg token.
      */}
      <DialogContent
        className="sm:max-w-[420px] p-8 auth-dialog-content"
      >
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{
            background: "linear-gradient(90deg, var(--vidzo-magenta), var(--vidzo-blue))",
          }}
        />

        <DialogHeader className="mb-2">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <VidzoLogo className="h-10 w-auto" />
          </div>

          <DialogTitle className="text-center font-display text-2xl font-black tracking-tight text-card-foreground">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </DialogTitle>

          <p className="text-center text-sm text-muted-foreground mt-1">
            {mode === "signin"
              ? "Sign in to your Vidzo workspace"
              : "Start creating viral content today"}
          </p>
        </DialogHeader>

        {/* Google button */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2.5 h-11 font-medium border-border bg-card hover:bg-secondary text-card-foreground"
          onClick={handleGoogle}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/>
            </svg>
          )}
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>or continue with email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Email / password form */}
        <form onSubmit={handleEmail} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dlg-email" className="text-card-foreground font-medium">
              Email
            </Label>
            <Input
              id="dlg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[var(--vidzo-magenta)]/50"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dlg-pass" className="text-card-foreground font-medium">
              Password
            </Label>
            <Input
              id="dlg-pass"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
              className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[var(--vidzo-magenta)]/50"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-bold text-white border-0 hover:opacity-90 transition-opacity"
            style={{
              background: "linear-gradient(135deg, var(--vidzo-magenta), var(--vidzo-blue))",
            }}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Please wait…</>
            ) : mode === "signin" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        {/* Toggle mode */}
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-sm text-muted-foreground hover:text-card-foreground transition-colors text-center pt-1"
        >
          {mode === "signin" ? (
            <>
              New here?{" "}
              <span className="font-semibold" style={{ color: "var(--vidzo-magenta)" }}>
                Create an account
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span className="font-semibold" style={{ color: "var(--vidzo-magenta)" }}>
                Sign in
              </span>
            </>
          )}
        </button>
      </DialogContent>
    </Dialog>
  );
}
