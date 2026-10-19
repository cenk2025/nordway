"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { CONTACT_EMAIL } from "@/config/contact";
import { submitContact, type ContactResult } from "@/features/contact/actions";

/**
 * Contact form. Submits via a server action that emails the team inbox through
 * Resend and sends the visitor an auto-reply. GDPR consent is required before
 * submit; a hidden honeypot field filters out simple bots.
 */
export function ContactForm() {
  const t = useTranslations("contactPage.form");
  const locale = useLocale();
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<ContactResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const res = await submitContact({
        name: String(data.get("name") || ""),
        email: String(data.get("email") || ""),
        message: String(data.get("message") || ""),
        website: String(data.get("website") || ""),
        locale,
        consent: consent as true,
      });
      setResult(res);
      if (res.ok) {
        form.reset();
        setConsent(false);
      }
    });
  }

  if (result?.ok) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 py-6">
        <CheckCircle2 className="h-8 w-8 text-primary" />
        <p className="text-lg font-semibold">{t("successTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("successBody")}</p>
        <Button type="button" variant="outline" onClick={() => setResult(null)}>
          {t("sendAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("name")}</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">{t("message")}</Label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[var(--primary)]"
        />
        <span>
          {t("consent")}{" "}
          <Link href="/legal/privacy" className="text-primary underline-offset-2 hover:underline">
            {t("consentLink")}
          </Link>
          .
        </span>
      </label>
      <Button type="submit" variant="cta" size="lg" disabled={!consent || pending}>
        <Send className="h-4 w-4" />
        {pending ? t("sending") : t("submit")}
      </Button>
      {result && !result.ok && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${result.error}`, { email: CONTACT_EMAIL })}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{t("replyNote", { email: CONTACT_EMAIL })}</p>
    </form>
  );
}
