/**
 * Credit helpers — credits system removed (Vidzo is free).
 * Kept as no-op shims so existing imports continue to compile.
 */

import { type SupabaseClient } from "@supabase/supabase-js";

export type CreditCheckResult =
  | { allowed: true }
  | { allowed: false; reason: "no_scripts" | "no_tweaks"; balance: number; tweakCount: number };

export async function isAdmin(_supabase: SupabaseClient, _token: string): Promise<boolean> {
  return true;
}

export async function checkAndConsume(
  _supabase: SupabaseClient,
  _userId: string,
  _token: string,
  _threadId: string | null,
  _kind: "script" | "tweak",
): Promise<CreditCheckResult> {
  return { allowed: true };
}

export async function getCreditInfo(
  _supabase: SupabaseClient,
  _userId: string,
  _threadId?: string,
): Promise<{ balance: number; tweakCount: number }> {
  return { balance: 999, tweakCount: 0 };
}
