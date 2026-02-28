import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Subscriber } from "@/types/subscriber";
import { startOfMonth, endOfMonth, isBefore, startOfDay, getDate, format, isSameMonth } from "date-fns";

export interface MonthlyStats {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  monthlyRevenue: number;
}

export function useMonthlyStats(subscribers: Subscriber[]) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [historicalStats, setHistoricalStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(false);

  const isCurrentMonth = useMemo(() => {
    return isSameMonth(selectedDate, new Date());
  }, [selectedDate]);

  // Current month stats from live subscriber data
  const currentMonthStats = useMemo((): MonthlyStats => {
    const total = subscribers.length;
    const paid = subscribers.filter((s) => s.status === "paid").length;
    const pending = subscribers.filter((s) => s.status === "pending").length;
    const overdue = subscribers.filter((s) => s.status === "overdue").length;
    const monthlyRevenue = subscribers
      .filter((s) => s.status === "paid")
      .reduce((sum, s) => sum + s.monthlyFee, 0);
    return { total, paid, pending, overdue, monthlyRevenue };
  }, [subscribers]);

  // Fetch historical stats for past months
  const fetchHistoricalStats = useCallback(async (date: Date) => {
    setLoading(true);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    // Get all subscribers that existed by the end of that month
    const { data: subsData, error: subsError } = await supabase
      .from("subscribers")
      .select("id, monthly_fee, created_at")
      .lte("created_at", monthEnd.toISOString());

    if (subsError) {
      console.error("Error fetching historical subscribers:", subsError);
      setLoading(false);
      return;
    }

    const activeSubscribers = subsData || [];
    const subscriberIds = activeSubscribers.map((s) => s.id);

    // Get payments made during that month
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("payments")
      .select("subscriber_id, amount")
      .gte("payment_date", format(monthStart, "yyyy-MM-dd"))
      .lte("payment_date", format(monthEnd, "yyyy-MM-dd"))
      .in("subscriber_id", subscriberIds.length > 0 ? subscriberIds : ["none"]);

    if (paymentsError) {
      console.error("Error fetching historical payments:", paymentsError);
      setLoading(false);
      return;
    }

    const paidSubscriberIds = new Set((paymentsData || []).map((p) => p.subscriber_id));
    const totalRevenue = (paymentsData || []).reduce((sum, p) => sum + Number(p.amount), 0);

    const total = activeSubscribers.length;
    const paid = paidSubscriberIds.size;
    const unpaid = total - paid;

    setHistoricalStats({
      total,
      paid,
      pending: 0, // Past months don't have pending — they're all overdue
      overdue: unpaid,
      monthlyRevenue: totalRevenue,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isCurrentMonth) {
      fetchHistoricalStats(selectedDate);
    } else {
      setHistoricalStats(null);
    }
  }, [selectedDate, isCurrentMonth, fetchHistoricalStats]);

  const stats = isCurrentMonth ? currentMonthStats : (historicalStats || { total: 0, paid: 0, pending: 0, overdue: 0, monthlyRevenue: 0 });

  return {
    selectedDate,
    setSelectedDate,
    isCurrentMonth,
    stats,
    loading,
  };
}
