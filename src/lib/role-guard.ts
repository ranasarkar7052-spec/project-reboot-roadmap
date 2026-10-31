import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { UserRole } from "./db-types";

/**
 * Client-side route gate for a portal. This only hides UI — the database
 * (RLS + SECURITY DEFINER RPCs) is what actually enforces access.
 */
export async function requireRole(role: UserRole, fallback: string, href: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw redirect({ href: `${fallback}?redirect=${encodeURIComponent(href)}` });
  const { data: row } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", role)
    .maybeSingle();
  if (!row) throw redirect({ href: `${fallback}?denied=1` });
}
