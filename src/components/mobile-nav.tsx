"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { MARKETING_NAV } from "@/lib/nav";

/** Slide-down navigation for small screens. */
export function MobileNav({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {open && (
        <div className="absolute inset-x-0 top-16 z-50 border-b bg-background p-4 shadow-lg">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1">
            {MARKETING_NAV.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className="justify-start"
                onClick={() => setOpen(false)}
              >
                <Link href={item.href}>{t(item.key)}</Link>
              </Button>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Button asChild variant="cta" onClick={() => setOpen(false)}>
                <Link href="/eligibility">{t("checkEligibility")}</Link>
              </Button>
              <Button asChild variant="outline" onClick={() => setOpen(false)}>
                <Link href={loggedIn ? "/dashboard" : "/login"}>
                  {loggedIn ? t("dashboard") : t("login")}
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
