"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/flags";
import { PRIVACY_NOTICE_VERSION } from "@/config/legal";
import { useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Disclaimer } from "@/components/disclaimer";

type Mode = "login" | "signup";

/**
 * Email + password / magic-link auth form. Mirrors the VOON `tyo` pattern.
 * On signup we attach `locale` to user metadata so the profile trigger picks
 * the right language. GDPR consent is required before signup.
 */
export function AuthForm({ mode, redirect }: { mode: Mode; redirect?: string }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(true);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = redirect || `/${locale}/${mode === "signup" ? "onboarding" : "dashboard"}`;
  const callback = () =>
    `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(next)}`;

  // Attached to auth.users.raw_user_meta_data at signup time so the DB
  // trigger (0007_consents.sql) can record consent atomically with account
  // creation — captured here rather than in a follow-up call because a
  // magic-link signup has no session (and thus no way to call the DB as
  // that user) until the visitor clicks the emailed link.
  const consentMetadata =
    mode === "signup" && consent
      ? {
          consent_privacy_terms: "true",
          consent_version: PRIVACY_NOTICE_VERSION,
        }
      : {};

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return setError(t("notConfigured"));
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callback(),
        shouldCreateUser: mode === "signup",
        data: { locale, ...consentMetadata },
      },
    });
    setLoading(false);
    if (error) setError(t("error"));
    else setSent(true);
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return setError(t("notConfigured"));
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: callback(), data: { locale, ...consentMetadata } },
          })
        : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(t("error"));
      return;
    }
    if (data.session) {
      router.push(next.replace(`/${locale}`, "") || "/dashboard");
      router.refresh();
    } else {
      setSent(true); // email confirmation required
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 [color:var(--success)]" />
        <h2 className="mb-1 font-semibold">{t("checkEmail")}</h2>
        <p className="text-sm text-muted-foreground">{t("checkEmailBody", { email })}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!configured && (
        <Disclaimer tone="warning">{t("notConfigured")}</Disclaimer>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={usePassword ? handlePassword : handleMagicLink} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {usePassword && (
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}

        {mode === "signup" && (
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
                {t("consentPrivacy")}
              </Link>{" "}
              {t("consentAnd")}{" "}
              <Link href="/legal/terms" className="text-primary underline-offset-2 hover:underline">
                {t("consentTerms")}
              </Link>
              .
            </span>
          </label>
        )}

        <Button
          type="submit"
          variant="cta"
          className="w-full"
          disabled={loading || (mode === "signup" && !consent)}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : usePassword ? (
            mode === "signup" ? t("signupButton") : t("loginButton")
          ) : (
            <>
              <Mail className="h-4 w-4" /> {t("magicLink")}
            </>
          )}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setUsePassword((v) => !v)}
        className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        {usePassword ? t("useMagicLink") : t("usePassword")}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? t("haveAccount") : t("noAccount")}{" "}
        <Link
          href={mode === "signup" ? "/login" : "/signup"}
          className="font-medium text-primary hover:underline"
        >
          {mode === "signup" ? t("signInInstead") : t("createOne")}
        </Link>
      </p>
    </div>
  );
}
