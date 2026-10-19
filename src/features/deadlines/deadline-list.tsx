import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import type { Deadline } from "@/lib/db/types";

/** Days between today (local midnight) and a YYYY-MM-DD date. Negative = past. */
function daysUntil(due: string): number {
  const d = new Date(due + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Read-only list of case deadlines with urgency. Used on the applicant's case
 * page and (compactly) on the dashboard. `withCaseLink` links each row to its
 * case (for the cross-case dashboard view).
 */
export function DeadlineList({
  deadlines,
  withCaseLink = false,
}: {
  deadlines: Deadline[];
  withCaseLink?: boolean;
}) {
  const t = useTranslations("deadlines");
  const locale = useLocale();

  if (deadlines.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {deadlines.map((d) => {
        const days = daysUntil(d.due_date);
        const overdue = !d.done && days < 0;
        const soon = !d.done && days >= 0 && days <= 7;
        const variant = d.done ? "muted" : overdue || soon ? "amber" : "info";
        const rel = d.done
          ? t("done")
          : overdue
            ? t("overdue")
            : days === 0
              ? t("today")
              : t("inDays", { n: days });
        return (
          <li key={d.id} className="flex items-center gap-3 p-3">
            {d.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 [color:var(--success)]" />
            ) : (
              <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t(`kind.${d.kind}`)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {new Date(d.due_date + "T00:00:00").toLocaleDateString(locale, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
                {d.note ? ` · ${d.note}` : ""}
                {withCaseLink && (
                  <>
                    {" · "}
                    <Link href={`/dashboard/${d.application_id}`} className="text-primary hover:underline">
                      {t("openCase")}
                    </Link>
                  </>
                )}
              </p>
            </div>
            <Badge variant={variant} className="shrink-0">
              {rel}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
