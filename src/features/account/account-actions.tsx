"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteAccount } from "@/features/account/actions";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/** GDPR self-service: download all data, or permanently delete the account. */
export function AccountActions() {
  const t = useTranslations("account");
  const locale = useLocale();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteAccount();
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(t("deleteError"));
      }
    });
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="outline">
        <a href={`/${locale}/account/export`} download>
          <Download className="h-4 w-4" /> {t("exportButton")}
        </a>
      </Button>

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4" /> {t("deleteTitle")}
        </p>
        <p className="mb-3 text-sm text-muted-foreground">{t("deleteWarning")}</p>
        {!confirming ? (
          <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
            <Trash2 className="h-4 w-4" /> {t("deleteButton")}
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{t("deleteConfirm")}</span>
            <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {t("deleteYes")}
            </Button>
            <Button variant="ghost" size="sm" disabled={isPending} onClick={() => setConfirming(false)}>
              {t("deleteNo")}
            </Button>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
