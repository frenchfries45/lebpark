import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityLog as ActivityLogType } from "@/hooks/useActivityLogs";
import { formatCurrencyForLocale } from "@/lib/formatNumbers";
import { Activity, DollarSign, UserPlus } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface ActivityLogProps {
  logs: ActivityLogType[];
  loading: boolean;
}

function formatLogDate(date: Date, lang: string) {
  const locale = lang === "ar" ? ar : enUS;
  if (isToday(date)) return format(date, "HH:mm", { locale });
  if (isYesterday(date)) return `${lang === "ar" ? "أمس" : "Yesterday"} ${format(date, "HH:mm", { locale })}`;
  return format(date, "EEE d MMM, HH:mm", { locale });
}

const actionConfig: Record<string, { icon: typeof DollarSign; bgClass: string; textClass: string }> = {
  payment_recorded: { icon: DollarSign, bgClass: "bg-status-paid-bg", textClass: "text-status-paid" },
  subscriber_added: { icon: UserPlus, bgClass: "bg-accent", textClass: "text-accent-foreground" },
};

export function ActivityLogComponent({ logs, loading }: ActivityLogProps) {
  const { t, i18n } = useTranslation();

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          {t("activityLog.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-48">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t("activityLog.noActivity")}
            </p>
          ) : (
            <div className="space-y-3 pe-3">
              {logs.map((log) => {
                const config = actionConfig[log.actionType] || actionConfig.payment_recorded;
                const Icon = config.icon;

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 text-sm border-b border-border/50 pb-3 last:border-0"
                  >
                    <div className={`p-1.5 rounded-md ${config.bgClass} ${config.textClass} mt-0.5 shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">
                        <span className="font-medium">{log.subscriberName}</span>
                        {" — "}
                        <span className="text-muted-foreground">
                          {t(`activityLog.action.${log.actionType}`)}
                        </span>
                        {log.amount != null && (
                          <span className="text-status-paid font-semibold">
                            {" "}
                            {formatCurrencyForLocale(log.amount, i18n.language)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("activityLog.recordedBy", { user: log.performedByUsername })}
                        {" · "}
                        {formatLogDate(log.createdAt, i18n.language)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
