"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { PERMIT_CATEGORIES } from "@/config/migri-2026";

const STATUSES = [
  "draft",
  "submitted",
  "in_review",
  "docs_needed",
  "ready",
  "submitted_to_authority",
  "decided",
  "closed",
] as const;

/** Status + category filter bar for the admin case list. Updates the URL query. */
export function AdminFilters({
  status,
  category,
}: {
  status?: string;
  category?: string;
}) {
  const t = useTranslations("adminCases");
  const ts = useTranslations("dashboard.status");
  const tc = useTranslations("categories");
  const router = useRouter();
  const pathname = usePathname();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams();
    const next = { status, category, [key]: value } as Record<string, string | undefined>;
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("filterStatus")}</span>
        <select
          value={status ?? ""}
          onChange={(e) => setParam("status", e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t("all")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ts(s)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("filterCategory")}</span>
        <select
          value={category ?? ""}
          onChange={(e) => setParam("category", e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t("all")}</option>
          {PERMIT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {tc(c)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
