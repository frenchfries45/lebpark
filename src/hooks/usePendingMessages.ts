import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PendingMessage {
  id: string;
  subscriberId: string | null;
  subscriberName: string;
  subscriberPhone: string;
  vehiclePlate: string;
  message: string;
  requestedByUsername: string;
  isBulk: boolean;
  status: "pending" | "sent";
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedByUsername: string | null;
}

export function usePendingMessages() {
  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async (statusFilter?: "pending" | "sent") => {
    setLoading(true);
    let query = supabase
      .from("pending_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching pending messages:", error);
      setLoading(false);
      return;
    }

    setMessages(
      (data || []).map((row) => ({
        id: row.id,
        subscriberId: row.subscriber_id,
        subscriberName: row.subscriber_name,
        subscriberPhone: row.subscriber_phone,
        vehiclePlate: row.vehicle_plate,
        message: row.message,
        requestedByUsername: row.requested_by_username,
        isBulk: row.is_bulk,
        status: row.status as "pending" | "sent",
        createdAt: new Date(row.created_at),
        resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
        resolvedByUsername: row.resolved_by_username,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages("pending");
  }, [fetchMessages]);

  const addPendingMessage = useCallback(
    async (msg: {
      subscriberId?: string;
      subscriberName: string;
      subscriberPhone: string;
      vehiclePlate: string;
      message: string;
      requestedByUserId: string;
      requestedByUsername: string;
      isBulk?: boolean;
    }) => {
      const { error } = await supabase.from("pending_messages").insert({
        subscriber_id: msg.subscriberId || null,
        subscriber_name: msg.subscriberName,
        subscriber_phone: msg.subscriberPhone,
        vehicle_plate: msg.vehiclePlate,
        message: msg.message,
        requested_by_user_id: msg.requestedByUserId,
        requested_by_username: msg.requestedByUsername,
        is_bulk: msg.isBulk || false,
        status: "pending",
      });

      if (error) {
        console.error("Error adding pending message:", error);
        return false;
      }
      return true;
    },
    []
  );

  const markAsSent = useCallback(
    async (messageId: string, resolvedByUsername: string) => {
      const { error } = await supabase
        .from("pending_messages")
        .update({
          status: "sent",
          resolved_at: new Date().toISOString(),
          resolved_by_username: resolvedByUsername,
        })
        .eq("id", messageId);

      if (error) {
        console.error("Error marking message as sent:", error);
        return false;
      }
      fetchMessages("pending");
      return true;
    },
    [fetchMessages]
  );

  const getPendingCountForSubscriber = useCallback(
    async (subscriberId: string): Promise<number> => {
      const { count, error } = await supabase
        .from("pending_messages")
        .select("*", { count: "exact", head: true })
        .eq("subscriber_id", subscriberId)
        .eq("status", "pending");

      if (error) return 0;
      return count || 0;
    },
    []
  );

  return {
    messages,
    loading,
    addPendingMessage,
    markAsSent,
    getPendingCountForSubscriber,
    refetch: () => fetchMessages("pending"),
    fetchAll: fetchMessages,
  };
}
