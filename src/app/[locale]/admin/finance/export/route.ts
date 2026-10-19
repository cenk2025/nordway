import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Admin CSV export of the transaction ledger. RLS limits this to admins. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let query = supabase.from("transactions").select("*").order("occurred_on", { ascending: false });
  if (from) query = query.gte("occurred_on", from);
  if (to) query = query.lte("occurred_on", to);
  const { data } = await query;
  const rows = data ?? [];

  const header = ["date", "type", "category", "description", "amount", "vat", "currency", "status"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.occurred_on, r.type, r.category, r.description, r.amount, r.vat, r.currency, r.status]
        .map(esc)
        .join(",")
    ),
  ];
  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nordway-finance.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
