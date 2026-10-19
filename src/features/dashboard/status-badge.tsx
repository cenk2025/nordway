import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/lib/db/types";

const VARIANT: Record<ApplicationStatus, "muted" | "info" | "amber" | "success"> = {
  draft: "muted",
  submitted: "info",
  in_review: "info",
  docs_needed: "amber",
  ready: "success",
  submitted_to_authority: "info",
  decided: "success",
  closed: "muted",
};

/** Renders a localized status chip for an application. */
export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const t = useTranslations("dashboard.status");
  return <Badge variant={VARIANT[status]}>{t(status)}</Badge>;
}
