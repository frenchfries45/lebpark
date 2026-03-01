import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ActivityLog as ActivityLogType } from "@/hooks/useActivityLogs";
import { formatCurrencyForLocale } from "@/lib/formatNumbers";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, isToday, isYesterday } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Activity,
  DollarSign,
  UserPlus,
  Users,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Receipt,
  Wallet,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CollectionPayment {
  subscriberName: string;
  amount: number;
  paymentDate: string;
}

interface CollectorStat {
  username: string;
  totalCollected: number;
  paymentCount: number;
  payments: CollectionPayment[];
}

interface ActivityLogProps {
  logs: ActivityLogType[];
  loading: boolean;
  selectedDate: Date; // ← follows the monthly filter
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLogDate(date: Date, lang: string) {
  const locale = lang === "ar" ? ar : enUS;
  if (isToday(date)) return format(date, "HH:mm", { locale });
  if (isYesterday(date))
    return `${lang === "ar" ? "أمس" : "Yesterday"} ${format(date, "HH:mm", { locale })}`;
  return format(date, "EEE d MMM, HH:mm", { locale });
}

const actionConfig: Record<
  string,
  { icon: typeof DollarSign; bgClass: string; textClass: string }
> = {
  payment_recorded: {
    icon: DollarSign,
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-green-700 dark:text-green-400",
  },
  subscriber_added: {
    icon: UserPlus,
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    textClass: "text-blue-700 dark:text-blue-400",
  },
};



// ─── Collector Card ───────────────────────────────────────────────────────────

function CollectorCard({
  stat,
  lang,
}: {
  stat: CollectorStat;
  lang: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-card transition-all duration-200">
      {/* Header row — always visible */}
      <button
        className="w-full text-start p-3 sm:p-4 flex items-center gap-3"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
      >
        {/* Avatar initial */}
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-muted-foreground uppercase">
            {stat.username.charAt(0)}
          </span>
        </div>

        {/* Username + payment count */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm capitalize truncate">
            {stat.username}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("collections.paymentsCount", { count: stat.paymentCount })}
          </p>
        </div>

        {/* Total + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-green-600 dark:text-green-400 text-sm">
            {formatCurrencyForLocale(stat.totalCollected, lang)}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded payment breakdown */}
      {expanded && (
        <div className="border-t border-border/50 px-3 sm:px-4 pb-3 pt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {t("collections.collectedFrom")}
          </p>
          <div className="space-y-1">
            {stat.payments.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-border/30 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Receipt className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-foreground truncate">{p.subscriberName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrencyForLocale(p.amount, lang)}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {format(new Date(p.paymentDate), "MMM d")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal footer */}
          <div className="flex items-center justify-between pt-2 mt-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t("collections.total")}
            </span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              {formatCurrencyForLocale(stat.totalCollected, lang)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ActivityLogComponent({ logs, loading, selectedDate }: ActivityLogProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [collectorStats, setCollectorStats] = useState<CollectorStat[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  // Fetch collections data for the selected month
  const fetchCollections = useCallback(async () => {
    setCollectionsLoading(true);

    const monthStart = format(startOfMonth(selectedDate), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(selectedDate), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("payments")
      .select("amount, payment_date, recorded_by_username, subscriber_id, subscribers(name)")
      .gte("payment_date", monthStart)
      .lte("payment_date", monthEnd)
      .order("payment_date", { ascending: false });

    if (error) {
      console.error("Error fetching collections:", error);
      setCollectionsLoading(false);
      return;
    }

    // Group by username
    const grouped: Record<string, CollectorStat> = {};

    for (const row of data || []) {
      const username = row.recorded_by_username || "Unknown";
      const subscriberName = (row.subscribers as any)?.name || "Unknown";

      if (!grouped[username]) {
        grouped[username] = {
          username,
          totalCollected: 0,
          paymentCount: 0,
          payments: [],
        };
      }

      grouped[username].totalCollected += Number(row.amount);
      grouped[username].paymentCount += 1;
      grouped[username].payments.push({
        subscriberName,
        amount: Number(row.amount),
        paymentDate: row.payment_date,
      });
    }

    const sorted = Object.values(grouped).sort(
      (a, b) => b.totalCollected - a.totalCollected
    );

    setCollectorStats(sorted);
    setCollectionsLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const grandTotal = collectorStats.reduce((s, e) => s + e.totalCollected, 0);
  const totalPayments = collectorStats.reduce((s, e) => s + e.paymentCount, 0);

  return (
    <Card className="animate-fade-in">
      <Tabs defaultValue="activity">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {t("activityLog.title")}
            </CardTitle>
            <TabsList className="h-8">
              <TabsTrigger value="activity" className="text-xs h-7 px-3">
                {t("activityLog.tabs.activity")}
              </TabsTrigger>
              <TabsTrigger value="collections" className="text-xs h-7 px-3 gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                {t("activityLog.tabs.collections")}
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <CardContent className="pt-0 px-4 sm:px-6 pb-4">
          {/* ── Tab 1: Activity Log ── */}
          <TabsContent value="activity" className="mt-0">
            <ScrollArea className="h-52">
              {loading ? (
                <div className="flex items-center justify-center h-full py-10">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Activity className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground text-center">
                    {t("activityLog.noActivity")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pe-2">
                  {logs.map((log) => {
                    const config =
                      actionConfig[log.actionType] || actionConfig.payment_recorded;
                    const Icon = config.icon;
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 text-sm border-b border-border/50 pb-3 last:border-0"
                      >
                        <div
                          className={cn(
                            "p-1.5 rounded-md mt-0.5 shrink-0",
                            config.bgClass,
                            config.textClass
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground leading-snug">
                            <span className="font-medium">{log.subscriberName}</span>
                            {" — "}
                            <span className="text-muted-foreground">
                              {t(`activityLog.action.${log.actionType}`)}
                            </span>
                            {log.amount != null && (
                              <span className="text-green-600 dark:text-green-400 font-semibold">
                                {" "}
                                {formatCurrencyForLocale(log.amount, lang)}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t("activityLog.recordedBy", {
                              user: log.performedByUsername,
                            })}
                            {" · "}
                            {formatLogDate(log.createdAt, lang)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* ── Tab 2: Collections ── */}
          <TabsContent value="collections" className="mt-0">
            {collectionsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : collectorStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Wallet className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground text-center">
                  {t("collections.noCollections")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Month summary banner */}
                <div className="flex items-center justify-between py-2.5 px-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                        {t("collections.monthTotal")}
                      </p>
                      <p className="text-xs text-green-600/70 dark:text-green-500">
                        {t("collections.paymentsCount", { count: totalPayments })}
                        {" · "}
                        {collectorStats.length}{" "}
                        {collectorStats.length === 1
                          ? t("collections.collector")
                          : t("collections.collectors")}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-green-700 dark:text-green-300 text-base">
                    {formatCurrencyForLocale(grandTotal, lang)}
                  </span>
                </div>

                {/* Collector cards */}
                <ScrollArea className="h-48">
                  <div className="space-y-2 pe-2">
                    {collectorStats.map((stat) => (
                      <CollectorCard
                        key={stat.username}
                        stat={stat}
                        lang={lang}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
