import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find tasks due today or overdue that aren't done
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const { data: dueTasks, error } = await supabaseAdmin
      .from("tasks")
      .select("id, title, due_date, status, user_id")
      .neq("status", "DONE")
      .not("due_date", "is", null)
      .lte("due_date", tomorrow)
      .order("due_date", { ascending: true });

    if (error) throw error;

    const overdue = dueTasks?.filter((t) => t.due_date! < today) ?? [];
    const dueToday = dueTasks?.filter((t) => t.due_date === today) ?? [];
    const dueTomorrow = dueTasks?.filter((t) => t.due_date === tomorrow) ?? [];

    return new Response(
      JSON.stringify({
        checked_at: new Date().toISOString(),
        overdue: overdue.length,
        due_today: dueToday.length,
        due_tomorrow: dueTomorrow.length,
        tasks: { overdue, dueToday, dueTomorrow },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("check-deadlines error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
