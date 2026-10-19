"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FinanceResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { supabase, ok: data?.role === "admin" };
}

const TxnSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().min(0).max(10_000_000),
  vat: z.number().min(0).max(10_000_000).default(0),
  category: z.string().max(80).optional().default(""),
  description: z.string().max(500).optional().default(""),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["paid", "pending"]).default("paid"),
});

/** Admin: add an income or expense entry to the ledger. */
export async function createTransaction(raw: z.input<typeof TxnSchema>): Promise<FinanceResult> {
  const parsed = TxnSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "forbidden" };

  const d = parsed.data;
  const { error } = await supabase.from("transactions").insert({
    type: d.type,
    amount: d.amount,
    vat: d.vat,
    category: d.category || null,
    description: d.description || null,
    occurred_on: d.occurredOn,
    status: d.status,
    currency: "EUR",
  });
  if (error) return { ok: false, error: "db" };

  revalidatePath("/admin/finance", "page");
  return { ok: true };
}

/** Admin: delete a ledger entry. */
export async function deleteTransaction(id: string): Promise<FinanceResult> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "forbidden" };
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { ok: false, error: "db" };
  revalidatePath("/admin/finance", "page");
  return { ok: true };
}

const CategorySchema = z.object({ name: z.string().trim().min(1).max(60) });

/** Admin: add an expense category (idempotent on name). */
export async function addExpenseCategory(raw: z.infer<typeof CategorySchema>): Promise<FinanceResult> {
  const parsed = CategorySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "forbidden" };
  const { error } = await supabase
    .from("expense_categories")
    .upsert({ name: parsed.data.name }, { onConflict: "name" });
  if (error) return { ok: false, error: "db" };
  revalidatePath("/admin/finance", "page");
  return { ok: true };
}

/** Admin: delete an expense category. */
export async function deleteExpenseCategory(id: string): Promise<FinanceResult> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "forbidden" };
  const { error } = await supabase.from("expense_categories").delete().eq("id", id);
  if (error) return { ok: false, error: "db" };
  revalidatePath("/admin/finance", "page");
  return { ok: true };
}
