"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Upload,
  FileText,
  Loader2,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { recordDocument, getSignedUrl, deleteDocument } from "@/features/documents/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { DocumentRow, DocumentStatus } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const DOC_TYPES = [
  "passport",
  "employment_contract",
  "income_proof",
  "diploma",
  "insurance",
  "other",
] as const;

const STATUS_META: Record<
  DocumentStatus,
  { variant: "muted" | "info" | "success" | "amber"; Icon: typeof Clock }
> = {
  pending: { variant: "muted", Icon: Clock },
  in_review: { variant: "info", Icon: Eye },
  approved: { variant: "success", Icon: CheckCircle2 },
  fix_needed: { variant: "amber", Icon: AlertTriangle },
};

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

/** Document vault: upload to the private bucket, list, view (signed URL), delete. */
export function DocumentVault({
  applicationId,
  userId,
  documents,
}: {
  applicationId: string;
  userId: string;
  documents: DocumentRow[];
}) {
  const t = useTranslations("documents");
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<(typeof DOC_TYPES)[number]>("passport");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleUpload(file: File) {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError(t("tooLarge"));
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
      const path = `${userId}/${applicationId}/${crypto.randomUUID()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, file, { upsert: false });
      if (upErr) {
        setError(t("uploadFailed"));
        setUploading(false);
        return;
      }
      const res = await recordDocument({
        applicationId,
        docType,
        fileName: file.name,
        storagePath: path,
      });
      if (!res.ok) {
        // Roll back the orphaned object if metadata insert failed.
        await supabase.storage.from("documents").remove([path]);
        setError(t("uploadFailed"));
      }
    } catch {
      setError(t("uploadFailed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleView(id: string) {
    const res = await getSignedUrl(id);
    if (res.ok) window.open(res.url, "_blank", "noopener,noreferrer");
    else setError(t("viewFailed"));
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteDocument(id);
    });
  }

  return (
    <div className="space-y-4">
      {/* Uploader */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="docType">{t("docType")}</Label>
            <select
              id="docType"
              value={docType}
              onChange={(e) => setDocType(e.target.value as (typeof DOC_TYPES)[number])}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {DOC_TYPES.map((d) => (
                <option key={d} value={d}>
                  {t(`types.${d}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
            <Button
              type="button"
              variant="cta"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {t("upload")}
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("uploadHint")}</p>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      {/* List */}
      {documents.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {documents.map((doc) => {
            const meta = STATUS_META[doc.status];
            return (
              <li key={doc.id} className="flex items-center gap-3 p-3">
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">{t(`types.${doc.doc_type}`)}</p>
                </div>
                <Badge variant={meta.variant} className="shrink-0">
                  <meta.Icon className="h-3 w-3" /> {t(`status.${doc.status}`)}
                </Badge>
                <Button variant="ghost" size="icon" aria-label={t("view")} onClick={() => handleView(doc.id)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("delete")}
                  disabled={isPending}
                  onClick={() => handleDelete(doc.id)}
                  className={cn(doc.status === "approved" && "opacity-50")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
