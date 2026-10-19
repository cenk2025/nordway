import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const alt = "Nordway — relocate from Türkiye to Finland";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Localized share card for every public page in this locale.
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #1b2740 0%, #22304a 60%, #2c4166 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontWeight: 800 }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: "#c0262d" }} />
          Nordway
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1 }}>{t("ogTitle")}</div>
          <div style={{ fontSize: 30, opacity: 0.85 }}>{t("ogSubtitle")}</div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.7 }}>Türkiye → Finland · Türkçe · Suomi · English</div>
      </div>
    ),
    size
  );
}
