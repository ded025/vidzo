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

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Redirect back to the app after email confirmation
            emailRedirectTo: `${window.location.origin}/chat/dashboard`,
          },
        });
        if (error) throw error;
        if (data.session) {
          // Immediate session (email confirmation disabled in Supabase)
          toast.success("Welcome to Vidzo!");
          onOpenChange(false);
          await navigate({ to: "/chat/dashboard" });
        } else {
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) {
          toast.success("Welcome back!");
          // Close dialog BEFORE navigating so the landing-page beforeLoad
          // no longer intercepts the route change.
          onOpenChange(false);
          await navigate({ to: "/chat/dashboard" });
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
    // Use /chat/dashboard as the redirect so OAuth callback lands on the app,
    // not the landing page (which would re-run beforeLoad and redirect to /chat/dashboard
    // anyway, but this avoids one extra redirect hop and the loop risk).
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/chat/dashboard`,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setLoading(false);
      return;
    }
    // OAuth flow will redirect the browser; no further action needed here.
    if (result.redirected) return;
    onOpenChange(false);
    await navigate({ to: "/chat/dashboard" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="p-6 sm:p-8">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <VidzoLogo className="h-10 w-auto" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </DialogTitle>
            <p className="text-center text-sm text-muted-foreground">
              Your end-to-end content engine.
            </p>
          </DialogHeader>

          <Button
            type="button"
            variant="outline"
            className="w-full mt-6"
            onClick={handleGoogle}
            disabled={loading}
          >
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <div>
              <Label htmlFor="dlg-email">Email</Label>
              <Input id="dlg-email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="dlg-pass">Password</Label>
              <Input id="dlg-pass" type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
