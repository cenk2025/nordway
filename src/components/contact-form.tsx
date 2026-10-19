"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";

const CONTACT_EMAIL = "hello@nordway.voon.fi";

/**
 * Phase-1 contact form. There is no backend yet, so on submit it composes a
 * pre-filled email via the user's mail client (mailto). Honest and functional;
 * a server action + Supabase/Resend pipeline arrives in Phase 2. GDPR consent
 * is required before submit.
 */
export function ContactForm() {
  const t = useTranslations("contactPage.form");
  const [consent, setConsent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const message = String(data.get("message") || "");
    const subject = encodeURIComponent(`Nordway — ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <Button type="submit" variant="cta" size="lg" disabled={!consent}>
        <Send className="h-4 w-4" />
        {t("submit")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("phase1Note", { email: CONTACT_EMAIL })}</p>
    </form>
  );
}
