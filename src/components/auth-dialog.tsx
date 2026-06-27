import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { VidzoLogo } from "./vidzo-logo";

export function AuthDialog({
  open,
  onOpenChange,
  defaultMode = "signin",
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  defaultMode?: "signin" | "signup";
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const goToDashboard = async () => {
    onOpenChange(false);
    await new Promise((resolve) => setTimeout(resolve, 30));
    await navigate({ to: "/chat/dashboard" });
  };

  const handleEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/chat/dashboard`,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Welcome to Vidzo!");
          await goToDashboard();
        } else {
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        toast.success("Welcome back!");
        await goToDashboard();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="auth-dialog-content p-8 sm:max-w-[420px]">
        <div
          className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
          style={{
            background: "linear-gradient(90deg, var(--vidzo-magenta), var(--vidzo-blue))",
          }}
        />

        <DialogHeader className="mb-2">
          <div className="mb-5 flex justify-center">
            <VidzoLogo className="h-10 w-auto" />
          </div>
          <DialogTitle className="text-center font-display text-2xl font-black tracking-tight text-card-foreground">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </DialogTitle>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in with your Vidzo email"
              : "Create your Supabase-backed Vidzo account"}
          </p>
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-2 font-medium"
          disabled={loading}
          onClick={async () => {
            try {
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (result?.error) throw result.error;
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Google sign-in failed");
            }
          }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </Button>

        <div className="my-3 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-4">

          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="dlg-name" className="font-medium text-card-foreground">
                Name
              </Label>
              <Input
                id="dlg-name"
                type="text"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                className="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-[var(--vidzo-magenta)]/50"
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="dlg-email" className="font-medium text-card-foreground">
              Email
            </Label>
            <Input
              id="dlg-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-[var(--vidzo-magenta)]/50"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dlg-pass" className="font-medium text-card-foreground">
              Password
            </Label>
            <Input
              id="dlg-pass"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "signup" ? "Minimum 6 characters" : "Your password"}
              className="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-[var(--vidzo-magenta)]/50"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>

          <Button
            type="submit"
            className="h-11 w-full border-0 font-bold text-white transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, var(--vidzo-magenta), var(--vidzo-blue))",
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait…
              </>
            ) : mode === "signin" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full pt-1 text-center text-sm text-muted-foreground transition-colors hover:text-card-foreground"
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
