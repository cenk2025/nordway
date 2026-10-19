import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "info" | "warning";

/**
 * Compliance callout. Used everywhere a legal disclaimer is required (Section 2
 * of the brief): "not an authority", "official fee ≠ service fee", "no guarantee",
 * "estimate only", etc. Keep these prominent — never bury them.
 */
export function Disclaimer({
  title,
  children,
  tone = "info",
  className,
}: {
  title?: string;
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const Icon = tone === "warning" ? AlertTriangle : Info;
  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-lg border p-4 text-sm leading-relaxed",
        tone === "warning"
          ? "border-[color:var(--warning)]/40 bg-aurora-amber/10"
          : "border-info/30 bg-info/8",
        className
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          tone === "warning" ? "[color:var(--warning)]" : "[color:var(--info)]"
        )}
        aria-hidden
      />
      <div className="space-y-1">
        {title && <p className="font-semibold text-foreground">{title}</p>}
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
