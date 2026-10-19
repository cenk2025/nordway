import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  Briefcase,
  Rocket,
  GraduationCap,
  Users,
  BadgeCheck,
  Building2,
  ShieldCheck,
  Clock,
  Languages,
  FileCheck2,
  Star,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container, Section, SectionHeading } from "@/components/marketing";
import { Disclaimer } from "@/components/disclaimer";
import { HeroGallery } from "@/features/hero/hero-gallery";

const CATEGORY_ICONS = {
  work: Briefcase,
  blueCard: BadgeCheck,
  entrepreneur: Building2,
  startup: Rocket,
  student: GraduationCap,
  family: Users,
  permanent: ShieldCheck,
} as const;

const VALUE_ICONS = [ShieldCheck, Clock, Languages, FileCheck2] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("categories");
  const tcd = await getTranslations("categoryDesc");

  const categories = ["work", "startup", "student", "family", "entrepreneur", "permanent"] as const;
  const values = t.raw("values.items") as { title: string; body: string }[];
  const steps = t.raw("steps.items") as { title: string; body: string }[];
  const testimonials = t.raw("testimonials.items") as {
    quote: string;
    name: string;
    role: string;
  }[];

  return (
    <>
      {/* Hero — editorial vertical-panel gallery on a warm, light ground.
          Set showValueOverlay to surface the headline + CTA above the gallery. */}
      <section className="border-b bg-[#fcfbf8] dark:bg-background">
        <h1 className="sr-only">{t("hero.title")}</h1>
        <Container className="py-8 sm:py-10">
          <HeroGallery showValueOverlay={false} />
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {t("hero.imageDisclaimer")}
          </p>
        </Container>
      </section>

      {/* Trust strip */}
      <div className="border-b bg-background">
        <Container className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-6 text-sm text-muted-foreground">
          {(t.raw("trust") as string[]).map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 [color:var(--success)]" />
              {item}
            </span>
          ))}
        </Container>
      </div>

      {/* Data security — short, concrete trust signal, not a marketing badge */}
      <div className="border-b bg-background">
        <Container className="py-8">
          <div className="flex flex-col items-start gap-4 rounded-lg border border-primary/15 bg-primary/5 p-5 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-base font-bold">{t("security.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("security.body")}</p>
            </div>
            <Link
              href="/about#security"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:ml-auto"
            >
              {t("security.link")}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </Container>
      </div>

      {/* Services */}
      <Section>
        <SectionHeading
          eyebrow={t("services.eyebrow")}
          title={t("services.title")}
          lead={t("services.lead")}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const Icon = CATEGORY_ICONS[c];
            return (
              <Card key={c} className="group transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold">{tc(c)}</h3>
                  <p className="text-sm text-muted-foreground">{tcd(c)}</p>
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2"
                  >
                    {t("services.more")} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* Steps */}
      <Section muted>
        <SectionHeading
          eyebrow={t("steps.eyebrow")}
          title={t("steps.title")}
          lead={t("steps.lead")}
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-base font-bold text-primary-foreground">
                {i + 1}
              </div>
              <h3 className="mb-1 font-display text-lg font-bold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Value props */}
      <Section>
        <SectionHeading
          eyebrow={t("values.eyebrow")}
          title={t("values.title")}
          lead={t("values.lead")}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => {
            const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
            return (
              <div key={i} className="space-y-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-aurora-green/15 [color:var(--success)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.body}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Testimonials (demo) */}
      <Section muted>
        <SectionHeading
          eyebrow={t("testimonials.eyebrow")}
          title={t("testimonials.title")}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((ts, i) => (
            <Card key={i}>
              <CardContent className="space-y-4 p-6">
                <div className="flex gap-0.5 [color:var(--warning)]">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed">&ldquo;{ts.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold">{ts.name}</p>
                  <p className="text-xs text-muted-foreground">{ts.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("testimonials.demoNote")}
        </p>
      </Section>

      {/* CTA + compliance */}
      <Section>
        <div className="overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold sm:text-4xl">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">{t("cta.body")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="cta" size="xl">
              <Link href="/eligibility">{t("cta.button")}</Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/contact">{t("cta.contact")}</Link>
            </Button>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-3xl">
          <Disclaimer title={t("compliance.title")}>{t("compliance.body")}</Disclaimer>
        </div>
      </Section>
    </>
  );
}
