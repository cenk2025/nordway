"use client";

import { useTranslations } from "next-intl";
import { LayoutList, BarChart3, Wallet } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", key: "cases", Icon: LayoutList, exact: true },
  { href: "/admin/metrics", key: "metrics", Icon: BarChart3, exact: false },
  { href: "/admin/finance", key: "finance", Icon: Wallet, exact: false },
] as const;

/** Tabs for the admin back-office sections. */
export function AdminNav() {
  const t = useTranslations("adminNav");
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-1 border-b">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <item.Icon className="h-4 w-4" />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
