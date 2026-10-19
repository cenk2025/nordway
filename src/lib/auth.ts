import { isSupabaseConfigured } from "@/lib/flags";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db/types";

/**
 * Returns the current authenticated user, or null. Safe to call before Supabase
 * is configured (returns null instead of throwing) so the marketing site works
 * even without keys.
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/** Returns the current user's profile row, or null. */
export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    return (data as Profile) ?? null;
  } catch {
    return null;
  }
}

/** True when the current user has the admin role. */
export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}
