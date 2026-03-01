import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: callerUser },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: callerRoleRows } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id);

    const callerRoles = (callerRoleRows ?? []).map((r: any) => r.role);
    const callerRole = callerRoles.includes("backend_admin")
      ? "backend_admin"
      : callerRoles.includes("admin")
      ? "admin"
      : callerRoles[0] ?? null;

    if (callerRole !== "admin" && callerRole !== "backend_admin") {
      return new Response(JSON.stringify({ error: "Admin or backend access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { username, password, role } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^[a-zA-Z]{5,10}$/.test(username)) {
      return new Response(
        JSON.stringify({ error: "Username must be 5-10 letters only" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "Username already taken" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const generatedEmail = `${username.toLowerCase()}@parkleb.internal`;

    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email: generatedEmail,
        password,
        email_confirm: true,
        user_metadata: { display_name: username },
      });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set username on profile
    await adminClient
      .from("profiles")
      .update({ username: username.toLowerCase() })
      .eq("user_id", newUser.user.id);

    // Determine the role to assign
    const assignedRole = ["admin", "employee", "backend_admin"].includes(role)
      ? role
      : "employee";

    // Use upsert to safely overwrite the default 'employee' role inserted by the
    // handle_new_user trigger. The trigger fires immediately on auth user creation
    // and always inserts 'employee' — upsert ensures our intended role wins.
    await adminClient
      .from("user_roles")
      .upsert(
        { user_id: newUser.user.id, role: assignedRole },
        { onConflict: "user_id" }
      );

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: newUser.user.id, username: username.toLowerCase(), role: assignedRole },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
