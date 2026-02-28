import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, displayName?: string) => {
    // Check if username is pre-approved
    const { data: isAllowed, error: allowedError } = await supabase
      .rpc("is_username_allowed", { lookup_username: username.toLowerCase() });

    if (allowedError || !isAllowed) {
      return { error: { message: "username_not_allowed" } as any };
    }

    // Check if username is already taken in profiles
    const { data: existing } = await supabase
      .rpc("get_email_by_username", { lookup_username: username.toLowerCase() });

    if (existing) {
      return { error: { message: "username_taken" } as any };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: displayName || username },
      },
    });

    if (error) return { error };

    // Update the profile with the username and claim it from allowed list
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ username: username.toLowerCase() })
        .eq("user_id", data.user.id);

      if (profileError) {
        console.error("Error setting username:", profileError);
      }

      // Remove from allowed_usernames
      await supabase.rpc("claim_allowed_username", { claimed_username: username.toLowerCase() });
    }

    return { error: null };
  };

  const signInWithUsername = async (username: string, password: string) => {
    // Look up email by username using a secure RPC function (works without auth)
    const { data: email, error: lookupError } = await supabase
      .rpc("get_email_by_username", { lookup_username: username.toLowerCase() });

    if (lookupError || !email) {
      return { error: { message: "invalid_credentials" } as any };
    }

    // Sign in with the email found from the profile
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return { user, session, loading, signUp, signIn, signInWithUsername, signOut };
}
