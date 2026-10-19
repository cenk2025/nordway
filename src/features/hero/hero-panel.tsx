"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeroPanelData {
  id: number;
  image: string;
  name: string;
  /** Permit-category key — translated via the `categories` namespace at render. */
  roleKey: string;
}

/**
 * A single tall, rounded gallery panel. When `active` it expands (the parent
 * drives width via flex-grow), the image zooms slightly, and the caption fades
 * in. Falls back to a labelled gradient placeholder until the real image exists.
 */
export function HeroPanel({
  index,
  image,
  name,
  role,
  active,
  priority,
  onActivate,
}: {
  index: number;
  image: string;
  name: string;
  /** Already-translated role label. */
  role: string;
  active: boolean;
  priority?: boolean;
  onActivate: () => void;
}) {
  const [imgOk, setImgOk] = useState(true);
  const caption = `${name} · ${role}`;

  return (
    <button
      type="button"
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      aria-label={caption}
      aria-pressed={active}
      style={{ flexGrow: active ? 3 : 1 }}
      className={cn(
        "group relative h-[clamp(420px,60vh,640px)] shrink-0 snap-center overflow-hidden rounded-3xl border border-black/5 bg-stone-200 outline-none transition-all duration-500 ease-out motion-reduce:transition-none dark:border-white/10 dark:bg-muted",
        "min-w-[78%] sm:min-w-[55%] md:min-w-0 md:shrink md:basis-0",
        active ? "shadow-2xl" : "shadow-sm",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      {imgOk ? (
        <Image
          src={image}
          alt={caption}
          fill
          priority={priority}
          sizes="(max-width: 768px) 80vw, 33vw"
          // Served straight from /public (no sharp optimizer) — avoids
          // intermittent "received null" optimizer errors when reading demo
          // images off the exFAT T7 drive. Demo files are already small.
          unoptimized
          onError={() => setImgOk(false)}
          className={cn(
            "object-cover object-center transition-transform duration-700 ease-out motion-reduce:transition-none",
            active ? "scale-105" : "scale-100"
          )}
        />
      ) : (
        // TODO: Cenk gerçek görselle değiştirecek
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300 text-stone-500 dark:from-muted dark:via-muted dark:to-accent dark:text-muted-foreground">
          <ImageIcon className="h-7 w-7" />
          <span className="px-3 text-center text-xs font-medium">
            Demo image — replace (hero-{index + 1}.jpg)
          </span>
        </div>
      )}

      {/* Caption — visible only on the active/featured panel */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent p-4 transition-opacity duration-500 motion-reduce:transition-none",
          active ? "opacity-100" : "opacity-0"
        )}
      >
        <p className="text-sm font-semibold tracking-tight text-white drop-shadow-sm">
          {caption}
        </p>
      </div>
    </button>
  );
}
