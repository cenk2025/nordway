"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { HeroPanel, type HeroPanelData } from "./hero-panel";

/**
 * Hero panel data — demo captions, editable in one place. Images live under
 * /public/demo (hero-1.jpg … hero-6.jpg); until they exist each panel shows a
 * labelled placeholder. Replace only `image` when real photos are ready.
 */
const PANELS: HeroPanelData[] = [
  { id: 1, image: "/demo/hero-1.jpg", name: "Aylin", roleKey: "work" },
  { id: 2, image: "/demo/hero-2.jpg", name: "Mert", roleKey: "startup" },
  { id: 3, image: "/demo/hero-3.jpg", name: "Emine", roleKey: "student" },
  { id: 4, image: "/demo/hero-4.jpg", name: "Mehmet", roleKey: "family" },
  { id: 5, image: "/demo/hero-5.jpg", name: "Defne", roleKey: "blueCard" },
  { id: 6, image: "/demo/hero-6.jpg", name: "Teoman", roleKey: "permanent" },
];

const FEATURED_DEFAULT = 2;
const CYCLE_MS = 3500;

/**
 * Horizontal gallery of tall panels with a featured (expanded) one. Hover,
 * focus or click on any panel features it immediately; the auto-cycle keeps
 * running unconditionally in the background regardless of interaction, so it
 * can never get stuck — a mouse resting anywhere over the strip (very common
 * while a visitor is simply reading the page) used to pause it indefinitely
 * until the pointer left the entire gallery, which looked exactly like a
 * frozen/broken carousel. Desktop = flex accordion; mobile = scroll-snap
 * carousel (tap to feature).
 */
export function HeroGallery({ showValueOverlay = false }: { showValueOverlay?: boolean }) {
  const t = useTranslations("home");
  const tc = useTranslations("categories");
  const [active, setActive] = useState(FEATURED_DEFAULT);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % PANELS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative">
      {showValueOverlay && (
        <div className="mb-6 flex flex-col items-start gap-3 sm:mb-8">
          <h1 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("hero.title")}
          </h1>
          <Button asChild variant="cta">
            <Link href="/eligibility">
              {t("hero.ctaPrimary")} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] md:overflow-hidden md:pb-0 snap-x snap-mandatory md:snap-none [&::-webkit-scrollbar]:hidden">
        {PANELS.map((p, i) => (
          <HeroPanel
            key={p.id}
            index={i}
            image={p.image}
            name={p.name}
            role={tc(p.roleKey)}
            active={active === i}
            priority={i === FEATURED_DEFAULT || i === 0}
            onActivate={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
}
