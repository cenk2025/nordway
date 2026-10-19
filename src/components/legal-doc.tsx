import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader, Section, Container } from "@/components/marketing";

interface LegalSection {
  heading: string;
  body: string | string[];
}

/**
 * Renders a legal document (privacy, terms, cookies, disclaimer) entirely from
 * the i18n catalogue under the given `namespace`. Each namespace provides
 * `title`, `lastUpdated`, `intro` and a `sections` array.
 */
export async function LegalDoc({
  namespace,
  locale,
}: {
  namespace: string;
  locale: string;
}) {
  setRequestLocale(locale);
  const t = await getTranslations(namespace);
  const sections = t.raw("sections") as LegalSection[];

  return (
    <>
      <PageHeader title={t("title")} />
      <Section>
        <Container className="max-w-3xl">
          <p className="mb-2 text-sm text-muted-foreground">
            {t("lastUpdatedLabel")}: {t("lastUpdated")}
          </p>
          <p className="mb-8 text-muted-foreground">{t("intro")}</p>
          <div className="space-y-8">
            {sections.map((s, i) => (
              <section key={i} className="space-y-2">
                <h2 className="font-display text-xl font-bold">{s.heading}</h2>
                {Array.isArray(s.body) ? (
                  <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                    {s.body.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="leading-relaxed text-muted-foreground">{s.body}</p>
                )}
              </section>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
