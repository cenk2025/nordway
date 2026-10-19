"use server";

import { createClient } from "@/lib/supabase/server";
import { getAnthropic, completeText } from "@/lib/ai/client";
import { CATEGORY_THRESHOLDS } from "@/config/migri-2026";
import type { Application, Quote, DocumentRow } from "@/lib/db/types";

export type AssessmentResult =
  | { ok: true; draft: string }
  | { ok: false; error: "forbidden" | "not_configured" | "not_found" | "upstream" };

/**
 * Admin-only: generate an AI DRAFT case assessment (likely permit type, missing
 * documents, risk points, recommended next steps, suggested price range). This
 * accelerates the expert — it never replaces the human decision. Uses adaptive
 * thinking. Degrades gracefully when no API key is configured.
 */
export async function generateCaseAssessment(applicationId: string): Promise<AssessmentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "forbidden" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { ok: false, error: "forbidden" };

  const client = getAnthropic();
  if (!client) return { ok: false, error: "not_configured" };

  const { data: appData } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();
  if (!appData) return { ok: false, error: "not_found" };
  const app = appData as Application;

  const [{ data: docsData }, { data: quoteData }] = await Promise.all([
    supabase.from("documents").select("*").eq("application_id", applicationId),
    supabase.from("quotes").select("*").eq("application_id", applicationId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const documents = (docsData as DocumentRow[]) ?? [];
  const quote = quoteData as Quote | null;

  const threshold = CATEGORY_THRESHOLDS[app.category];
  const caseSummary = {
    category: app.category,
    tier: app.tier,
    complexity: app.complexity,
    target: app.target_city || app.target_country,
    income_region: app.income_region,
    family_members: app.family_members,
    urgent: app.urgent,
    status: app.status,
    notes: app.notes,
    threshold_reference_2026: threshold,
    documents: documents.map((d) => ({ type: d.doc_type, status: d.status })),
    current_estimate_eur: quote
      ? { gross_min: quote.range_gross_min, gross_max: quote.range_gross_max }
      : null,
  };

  const system = `You are an internal assistant for a Nordway relocation expert reviewing a Finland immigration case. Produce a concise DRAFT assessment in English to speed up the human expert. You are NOT making the decision.

Use these section headers exactly:
1. Likely permit category & fit
2. Missing or weak documents
3. Risk points
4. Recommended next steps
5. Suggested service-fee posture (relative — e.g. "standard", "raise to complex"; do NOT invent exact euro prices)

Rules: base everything only on the provided case data; flag unknowns rather than assuming; reference Migri 2026 thresholds as approximate and to be verified; never guarantee an outcome; keep it under ~250 words. End with: "Draft for expert review — not a decision."`;

  try {
    const { text, refused } = await completeText(client, {
      max_tokens: 1500,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system,
      messages: [
        {
          role: "user",
          content: `Assess this case:\n\n${JSON.stringify(caseSummary, null, 2)}`,
        },
      ],
    });
    if (refused || !text) return { ok: false, error: "upstream" };
    return { ok: true, draft: text };
  } catch {
    return { ok: false, error: "upstream" };
  }
}
