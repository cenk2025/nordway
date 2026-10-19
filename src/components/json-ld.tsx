/**
 * Renders schema.org structured data for search engines and AI answer engines.
 * `<` is escaped so a string inside the payload can never close the tag (see
 * the Next.js JSON-LD guide). Not executable script, so the CSP doesn't apply.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
