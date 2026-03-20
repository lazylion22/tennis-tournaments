"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Determine the actual theme being displayed
  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <button
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center size-9 rounded-lg border border-border hover:bg-muted transition-colors"
      title={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
      aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
    >
      {currentTheme === "dark" ? (
        <Sun className="size-4 text-foreground" />
      ) : (
        <Moon className="size-4 text-foreground" />
      )}
    </button>
  );
}