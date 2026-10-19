"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, X, Loader2 } from "lucide-react";
import { addExpenseCategory, deleteExpenseCategory } from "@/features/admin/finance-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/** Admin: manage the expense-category list used by the ledger. */
export function ExpenseCategories({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const t = useTranslations("finance");
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    const v = name.trim();
    if (!v) return;
    startTransition(async () => {
      const res = await addExpenseCategory({ name: v });
      if (res.ok) setName("");
    });
  }

  return (
    <div className="space-y-3">
      <form onSubmit={add} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("newCategory")}
          className="max-w-xs"
        />
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t("addCategory")}
        </Button>
      </form>
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noCategories")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Badge key={c.id} variant="muted" className="gap-1.5 py-1 pl-2.5 pr-1">
              {c.name}
              <button
                type="button"
                aria-label={t("delete")}
                disabled={isPending}
                onClick={() => startTransition(async () => void (await deleteExpenseCategory(c.id)))}
                className="rounded-full p-0.5 hover:bg-foreground/10"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
