import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GDPR data export. Returns a JSON file with everything we hold for the signed-in
 * user. RLS scopes every query to the caller, so no extra filtering is needed.
 * Auth is enforced by the proxy (account/* is protected) and re-checked here.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const [profile, applications, quotes, documents, messages] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("applications").select("*"),
    supabase.from("quotes").select("*"),
    supabase.from("documents").select("*"),
    supabase.from("messages").select("*"),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile: profile.data ?? null,
    applications: applications.data ?? [],
    quotes: quotes.data ?? [],
    documents: documents.data ?? [],
    messages: messages.data ?? [],
    note: "This export contains the personal data Nordway holds about you. Document files themselves are stored separately in your private vault.",
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="nordway-data-${user.id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
