/**
 * Server-side credit helpers.
 * All functions receive an authenticated supabase client (scoped to the user's JWT).
 */

import { type SupabaseClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "pratikppithadia@gmail.com";
const FREE_SCRIPTS = 5;
const FREE_TWEAKS_PER_THREAD = 3;

/** Returns true if the user is the admin — skip all credit checks. */
export async function isAdmin(supabase: SupabaseClient, token: string): Promise<boolean> {
  const { data } = await supabase.auth.getUser(token);
  return data?.user?.email === ADMIN_EMAIL;
}

export type CreditCheckResult =
  | { allowed: true }
  | { allowed: false; reason: "no_scripts" | "no_tweaks"; balance: number; tweakCount: number };

/**
 * Check + consume one action.
 * kind = "script"  → deducts 1 from user_credits.balance
 * kind = "tweak"   → increments threads.tweak_count (max FREE_TWEAKS_PER_THREAD)
 */
export async function checkAndConsume(
  supabase: SupabaseClient,
  userId: string,
  token: string,
  threadId: string | null,
  kind: "script" | "tweak",
): Promise<CreditCheckResult> {
  // Admin bypass
  if (await isAdmin(supabase, token)) return { allowed: true };

  if (kind === "script") {
    // Upsert wallet if missing (safety net)
    await supabase
      .from("user_credits")
      .upsert({ user_id: userId, balance: FREE_SCRIPTS }, { onConflict: "user_id", ignoreDuplicates: true });

    const { data: wallet } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const balance = wallet?.balance ?? 0;
    if (balance <= 0) {
      return { allowed: false, reason: "no_scripts", balance, tweakCount: 0 };
    }

    // Deduct
    await supabase
      .from("user_credits")
      .update({ balance: balance - 1, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: -1,
      reason: "script_generation",
      thread_id: threadId,
    });

    return { allowed: true };
  }

  if (kind === "tweak") {
    if (!threadId) return { allowed: true }; // no thread context = no limit

    const { data: thread } = await supabase
      .from("threads")
      .select("tweak_count")
      .eq("id", threadId)
      .maybeSingle();

    const tweakCount = thread?.tweak_count ?? 0;
    if (tweakCount >= FREE_TWEAKS_PER_THREAD) {
      // Check if they have paid credits for extra tweaks
      const { data: wallet } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .single();
      const balance = wallet?.balance ?? 0;
      if (balance <= 0) {
        return { allowed: false, reason: "no_tweaks", balance, tweakCount };
      }
      // Consume a script credit for the extra tweak
      await supabase
        .from("user_credits")
        .update({ balance: balance - 1, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: -1,
        reason: "tweak",
        thread_id: threadId,
      });
    } else {
      // Free tweak — increment counter
      await supabase
        .from("threads")
        .update({ tweak_count: tweakCount + 1 })
        .eq("id", threadId);
    }
    return { allowed: true };
  }

  return { allowed: true };
}

/** Return wallet balance + thread tweak count for the client. */
export async function getCreditInfo(
  supabase: SupabaseClient,
  userId: string,
  threadId?: string,
): Promise<{ balance: number; tweakCount: number }> {
  const { data: wallet } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  let tweakCount = 0;
  if (threadId) {
    const { data: thread } = await supabase
      .from("threads")
      .select("tweak_count")
      .eq("id", threadId)
      .maybeSingle();
    tweakCount = thread?.tweak_count ?? 0;
  }

  return { balance: wallet?.balance ?? 0, tweakCount };
}
