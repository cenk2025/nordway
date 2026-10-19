import { CONTACT_EMAIL } from "@/config/contact";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

/**
 * schema.org builders (JSON-LD). Facts only — no ratings or reviews until
 * real, verifiable ones exist (fake review markup is penalised by Google and
 * distrusted by AI answer engines).
 */

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

export function organizationLd(locale: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: absoluteUrl(locale),
    logo: `${SITE_URL}/icon.svg`,
    email: CONTACT_EMAIL,
    description,
    slogan: "Your trusted path to the North",
    areaServed: [
      { "@type": "Country", name: "Finland" },
      { "@type": "Country", name: "Türkiye" },
    ],
    knowsLanguage: ["tr", "fi", "en"],
    knowsAbout: [
      "Finnish residence permits",
      "Moving to Finland",
      "Work-based residence permit in Finland",
      "EU Blue Card Finland",
      "Starting a business in Finland",
      "Start-up permit Finland",
      "Studying in Finland",
      "Family reunification in Finland",
      "Permanent residence in Finland",
      "Settling in Finland (DVV, Kela, Vero)",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT_EMAIL,
      availableLanguage: ["Turkish", "Finnish", "English"],
    },
    parentOrganization: {
      "@type": "Organization",
      name: "VOON IQ",
      url: "https://voon.fi",
      logo: `${SITE_URL}/brand/vooniq-logo.png`,
    },
  };
}

export function websiteLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE_NAME,
    url: absoluteUrl(locale),
    inLanguage: locale,
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqLd(items: { q: string; a: string }[], locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function servicesLd(
  locale: string,
  services: { name: string; description: string }[],
  pageUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: pageUrl,
    inLanguage: locale,
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.name,
        description: s.description,
        serviceType: "Immigration and relocation advisory",
        provider: { "@id": ORG_ID },
        areaServed: { "@type": "Country", name: "Finland" },
        availableLanguage: ["Turkish", "Finnish", "English"],
      },
    })),
  };
}

export function articleLd(opts: {
  locale: string;
  url: string;
  headline: string;
  description: string;
  dateModified: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: opts.url,
    headline: opts.headline,
    description: opts.description,
    inLanguage: opts.locale,
    dateModified: opts.dateModified,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    image: `${SITE_URL}/${opts.locale}/opengraph-image`,
  };
}

export function howToLd(opts: { locale: string; name: string; steps: { name: string; text: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.name,
    inLanguage: opts.locale,
    step: opts.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })),
  };
}
