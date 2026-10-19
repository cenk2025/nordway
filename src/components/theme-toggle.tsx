"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Light/dark toggle. No theme library and no inline script: it flips the `.dark`
 * class on <html> for instant feedback and writes a `nordway_theme` cookie that
 * the server reads to render the class on every load / locale switch (no flash,
 * nothing for React 19 to warn about). Icons swap via the `.dark` CSS variant.
 */
export function ThemeToggle() {
  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    document.cookie = `nordway_theme=${isDark ? "dark" : "light"}; path=/; max-age=31536000; SameSite=Lax`;
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
      <Moon className="h-4 w-4 dark:hidden" />
      <Sun className="hidden h-4 w-4 dark:block" />
    </Button>
  );
}
