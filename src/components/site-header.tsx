import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { MobileNav } from "@/components/mobile-nav";
import { UserMenu } from "@/features/auth/user-menu";
import { MARKETING_NAV } from "@/lib/nav";

/** Public top navigation. */
export async function SiteHeader() {
  const t = await getTranslations("nav");
  const user = await getCurrentUser();
  const admin = user ? await isAdmin() : false;

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      {/* Institutional accent stripe — signals an official, authoritative site. */}
      <div className="h-[3px] bg-primary" aria-hidden />
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
          <Compass className="h-6 w-6 text-primary" aria-hidden />
          <span>Nordway</span>
        </Link>

        <nav className="ml-8 hidden items-center gap-0.5 text-sm lg:flex">
          {MARKETING_NAV.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{t(item.key)}</Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          {user ? (
            <UserMenu
              email={user.email ?? ""}
              name={(user.user_metadata?.full_name as string) ?? null}
              isAdmin={admin}
            />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button asChild variant="cta" size="sm" className="hidden sm:inline-flex">
                <Link href="/eligibility">{t("getStarted")}</Link>
              </Button>
            </>
          )}
          <MobileNav loggedIn={Boolean(user)} />
        </div>
      </div>
    </header>
  );
}
