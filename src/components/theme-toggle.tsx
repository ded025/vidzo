import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = t;
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const v = window.localStorage.getItem("vidzo-theme");
  if (v === "light") return "light";
  // Default is dark unless user explicitly chose light
  return "dark";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    const t = getStoredTheme();
    setTheme(t);
    applyTheme(t);
  }, []);
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem("vidzo-theme", next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary transition-colors ${className}`}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

// Inline script string for SSR — applied before hydration to avoid flash.
export const THEME_INIT_SCRIPT = `(function(){try{var k='vidzo-theme';var v=localStorage.getItem(k);var r=document.documentElement;if(v==='light'){r.style.colorScheme='light';}else{r.classList.add('dark');r.style.colorScheme='dark';if(!v)localStorage.setItem(k,'dark');}}catch(e){}})();`;
