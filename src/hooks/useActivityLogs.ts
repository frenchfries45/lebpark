import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityLog {
  id: string;
  actionType: string;
  performedByUsername: string;
  subscriberName: string;
  amount: number | null;
  details: string | null;
  createdAt: Date;
}

export function useActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    // Fetch logs from the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching activity logs:", error);
      setLoading(false);
      return;
    }

    const mapped: ActivityLog[] = (data || []).map((row) => ({
      id: row.id,
      actionType: row.action_type,
      performedByUsername: row.performed_by_username,
      subscriberName: row.subscriber_name,
      amount: row.amount ? Number(row.amount) : null,
      details: row.details,
      createdAt: new Date(row.created_at),
    }));

    setLogs(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = useCallback(async (log: {
    actionType: string;
    performedByUserId: string;
    performedByUsername: string;
    subscriberId?: string;
    subscriberName: string;
    amount?: number;
    details?: string;
  }) => {
    const { error } = await supabase.from("activity_logs").insert({
      action_type: log.actionType,
      performed_by_user_id: log.performedByUserId,
      performed_by_username: log.performedByUsername,
      subscriber_id: log.subscriberId,
      subscriber_name: log.subscriberName,
      amount: log.amount || null,
      details: log.details || null,
    });

    if (error) {
      console.error("Error adding activity log:", error);
      return;
    }

    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, addLog, refetch: fetchLogs };
}
