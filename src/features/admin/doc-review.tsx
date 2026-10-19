"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { FileText, Download, Check, AlertTriangle, Loader2 } from "lucide-react";
import { getSignedUrl } from "@/features/documents/actions";
import { updateDocumentStatus } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DocumentRow, DocumentStatus } from "@/lib/db/types";

const VARIANT: Record<DocumentStatus, "muted" | "info" | "success" | "amber"> = {
  pending: "muted",
  in_review: "info",
  approved: "success",
  fix_needed: "amber",
};

/** Admin document review: view (signed URL), approve, or request a fix. */
export function DocReview({
  applicationId,
  documents,
}: {
  applicationId: string;
  documents: DocumentRow[];
}) {
  const t = useTranslations("adminCase");
  const td = useTranslations("documents");
  const [isPending, startTransition] = useTransition();

  function setStatus(documentId: string, status: DocumentStatus) {
    startTransition(async () => {
      await updateDocumentStatus({ documentId, applicationId, status });
    });
  }

  async function view(id: string) {
    const res = await getSignedUrl(id);
    if (res.ok) window.open(res.url, "_blank", "noopener,noreferrer");
  }

  if (documents.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{t("noDocs")}</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {documents.map((doc) => (
        <li key={doc.id} className="flex flex-wrap items-center gap-2 p-3">
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{doc.file_name}</p>
            <p className="text-xs text-muted-foreground">{td(`types.${doc.doc_type}`)}</p>
          </div>
          <Badge variant={VARIANT[doc.status]}>{td(`status.${doc.status}`)}</Badge>
          <Button variant="ghost" size="icon" aria-label={td("view")} onClick={() => view(doc.id)}>
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setStatus(doc.id, "approved")}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {t("approve")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setStatus(doc.id, "fix_needed")}
          >
            <AlertTriangle className="h-3.5 w-3.5" /> {t("requestFix")}
          </Button>
        </li>
      ))}
    </ul>
  );
}
