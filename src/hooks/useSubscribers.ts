import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Subscriber, PaymentStatus } from "@/types/subscriber";
import { endOfMonth, startOfMonth, startOfDay, isBefore, getDate } from "date-fns";

const calculateStatus = (validUntil: Date | null): PaymentStatus => {
  const today = startOfDay(new Date());
  const currentMonthStart = startOfMonth(today);
  
  // If validity covers the current month, subscriber is paid
  if (validUntil && !isBefore(validUntil, currentMonthStart)) return "paid";
  
  // Payment for current month not made - check day of month
  const dayOfMonth = getDate(today);
  if (dayOfMonth <= 5) return "pending";
  return "overdue";
};

export function useSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscribers:", error);
      setLoading(false);
      return;
    }

    const mapped: Subscriber[] = (data || []).map((row) => {
      const validUntil = row.validity_end ? new Date(row.validity_end) : null;
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        car: row.car || 'Not Available',
        vehiclePlate: row.vehicle_plate,
        monthlyFee: Number(row.monthly_fee),
        lastPaymentDate: row.last_payment_date ? new Date(row.last_payment_date) : null,
        validUntil,
        status: calculateStatus(validUntil),
        createdAt: new Date(row.created_at),
      };
    });

    setSubscribers(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const addSubscriber = useCallback(async (data: Omit<Subscriber, "id" | "createdAt" | "status">) => {
    const status = calculateStatus(data.validUntil);
    
    const { error } = await supabase.from("subscribers").insert({
      name: data.name,
      phone: data.phone,
      car: data.car || 'Not Available',
      vehicle_plate: data.vehiclePlate,
      monthly_fee: data.monthlyFee,
      last_payment_date: data.lastPaymentDate?.toISOString().split("T")[0] || null,
      validity_end: data.validUntil?.toISOString().split("T")[0] || null,
      status,
    });

    if (error) {
      console.error("Error adding subscriber:", error);
      return;
    }

    fetchSubscribers();
  }, [fetchSubscribers]);

  const updateSubscriber = useCallback(async (id: string, data: { name: string; phone: string; car: string; vehiclePlate: string; monthlyFee: number }) => {
    const { error } = await supabase
      .from("subscribers")
      .update({
        name: data.name,
        phone: data.phone,
        car: data.car || 'Not Available',
        vehicle_plate: data.vehiclePlate,
        monthly_fee: data.monthlyFee,
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating subscriber:", error);
      return;
    }

    fetchSubscribers();
  }, [fetchSubscribers]);

  const deleteSubscriber = useCallback(async (id: string) => {
    // Delete payments first (foreign key)
    const { error: paymentsError } = await supabase
      .from("payments")
      .delete()
      .eq("subscriber_id", id);

    if (paymentsError) {
      console.error("Error deleting payments:", paymentsError);
      return;
    }

    const { error } = await supabase
      .from("subscribers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting subscriber:", error);
      return;
    }

    fetchSubscribers();
  }, [fetchSubscribers]);

  const recordPayment = useCallback(async (subscriberId: string, amount: number, recordedByUsername?: string) => {
    const today = new Date();
    const newValidUntil = endOfMonth(today);

    const { error: paymentError } = await supabase.from("payments").insert({
      subscriber_id: subscriberId,
      amount,
      payment_date: today.toISOString().split("T")[0],
      recorded_by_username: recordedByUsername || null,
    });

    if (paymentError) {
      console.error("Error recording payment:", paymentError);
      return;
    }

    const { error: updateError } = await supabase
      .from("subscribers")
      .update({
        last_payment_date: today.toISOString().split("T")[0],
        validity_end: newValidUntil.toISOString().split("T")[0],
        status: "paid",
      })
      .eq("id", subscriberId);

    if (updateError) {
      console.error("Error updating subscriber:", updateError);
      return;
    }

    fetchSubscribers();
  }, [fetchSubscribers]);

  return {
    subscribers,
    loading,
    addSubscriber,
    updateSubscriber,
    deleteSubscriber,
    recordPayment,
    refetch: fetchSubscribers,
  };
}
