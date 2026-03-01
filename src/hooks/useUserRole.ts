import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "employee" | "backend_admin";

export function useUserRole(userId: string | undefined) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } else if (!data || data.length === 0) {
        setRole(null);
      } else {
        // Priority: backend_admin > admin > employee
        const roles = data.map((r) => r.role as AppRole);
        if (roles.includes("backend_admin")) setRole("backend_admin");
        else if (roles.includes("admin")) setRole("admin");
        else setRole("employee");
      }
      setLoading(false);
    };

    fetchRole();
  }, [userId]);

  const isAdmin = role === "admin";
  const isEmployee = role === "employee";
  const isBackendAdmin = role === "backend_admin";

  return { role, isAdmin, isEmployee, isBackendAdmin, loading };
}
