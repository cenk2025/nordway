import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-6xl font-extrabold text-primary">404</p>
      <p className="max-w-md text-muted-foreground">{t("body")}</p>
      <Button asChild variant="cta">
        <Link href="/">{t("home")}</Link>
      </Button>
    </div>
  );
}
