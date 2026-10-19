"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Send, Loader2, CheckCheck } from "lucide-react";
import { sendMessage, markThreadRead } from "@/features/messaging/actions";
import { Button } from "@/components/ui/button";
import type { Message } from "@/lib/db/types";
import { cn } from "@/lib/utils";

/**
 * Secure per-case message thread between the applicant and the Nordway expert.
 * Server-rendered messages are passed in; sending posts via a server action and
 * refreshes. Opening the thread marks the other party's messages as read.
 */
export function MessageThread({
  applicationId,
  currentUserId,
  messages,
}: {
  applicationId: string;
  currentUserId: string;
  messages: Message[];
}) {
  const t = useTranslations("messaging");
  const locale = useLocale();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  // Mark the other side's messages as read on open (no local state change).
  useEffect(() => {
    markThreadRead(applicationId);
  }, [applicationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    startTransition(async () => {
      const res = await sendMessage({ applicationId, body: text });
      if (res.ok) setBody("");
    });
  }

  return (
    <div className="flex flex-col">
      <div className="max-h-96 space-y-3 overflow-y-auto p-1">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {!mine && (
                    <p className="mb-0.5 text-xs font-semibold opacity-80">
                      {m.sender_role === "admin" ? t("expert") : t("you")}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={cn("mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70")}>
                    {new Date(m.created_at).toLocaleString(locale, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                    {mine && m.read_at && <CheckCheck className="h-3 w-3" />}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="mt-3 flex items-end gap-2 border-t pt-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder={t("placeholder")}
          className="flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
          }}
        />
        <Button type="submit" variant="cta" size="icon" disabled={isPending || !body.trim()} aria-label={t("send")}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
      <p className="mt-1 text-[11px] text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
