"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  routing,
  type Locale,
  LOCALE_LABELS,
  ACTIVE_LOCALES,
} from "@/i18n/routing";
import { flags } from "@/lib/flags";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Language switcher. tr/fi/en are always active. sv/no are shown but disabled
 * with a "Coming soon" hint until the NEXT_PUBLIC_FEATURE_LOCALES_SV_NO flag
 * is enabled — see routing.ts.
 */
export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  function isActive(l: Locale) {
    return flags.localesSvNo || (ACTIVE_LOCALES as readonly string[]).includes(l);
  }

  const current = LOCALE_LABELS[locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          aria-label="Change language"
          className="gap-1.5"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{current.flag} {current.native}</span>
          <span className="sm:hidden">{current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        {routing.locales.map((l) => {
          const label = LOCALE_LABELS[l];
          const active = isActive(l);
          return (
            <DropdownMenuItem
              key={l}
              disabled={!active}
              onSelect={() => active && switchTo(l)}
              className={cn(
                "justify-between",
                l === locale && "font-semibold"
              )}
            >
              <span>
                {label.flag} {label.native}
              </span>
              {!active && (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Coming soon
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
