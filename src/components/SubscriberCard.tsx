import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Subscriber } from "@/types/subscriber";
import { Car, Phone, Calendar, CreditCard, MessageSquare, History, Pencil, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { formatPhoneForLocale, formatPlateForLocale, formatCurrencyForLocale } from "@/lib/formatNumbers";

interface SubscriberCardProps {
  subscriber: Subscriber;
  isAdmin: boolean;
  hasPendingMessage?: boolean;
  onSendReminder: (subscriber: Subscriber) => void;
  onRecordPayment: (subscriber: Subscriber) => void;
  onViewHistory: (subscriber: Subscriber) => void;
  onEdit?: (subscriber: Subscriber) => void;
  onDelete?: (subscriber: Subscriber) => void;
}

export function SubscriberCard({
  subscriber,
  isAdmin,
  hasPendingMessage = false,
  onSendReminder,
  onRecordPayment,
  onViewHistory,
  onEdit,
  onDelete,
}: SubscriberCardProps) {
  const { t, i18n } = useTranslation();

  const formatDate = (date: Date | null) => {
    if (!date) return t("subscriber.notYetPaid");
    return format(date, "MMM dd, yyyy");
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-elevated animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-lg">{subscriber.name}</h3>
              {hasPendingMessage && (
                <Badge variant="secondary" className="gap-1 text-xs bg-amber-100 text-amber-700 border-amber-200">
                  <Clock className="w-3 h-3" />
                  Message Pending
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
              <Phone className="w-3.5 h-3.5" />
              <span>{formatPhoneForLocale(subscriber.phone, i18n.language)}</span>
            </div>
          </div>
          <StatusBadge status={subscriber.status} />
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Car className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("subscriber.car")}:</span>
            <span className="font-medium text-foreground">{subscriber.car}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Car className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("subscriber.plate")}:</span>
            <span className="font-medium text-foreground">
              {formatPlateForLocale(subscriber.vehiclePlate, i18n.language)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("subscriber.monthlyFee")}:</span>
            <span className="font-medium text-foreground">
              {formatCurrencyForLocale(subscriber.monthlyFee, i18n.language)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("subscriber.lastPaid")}:</span>
            <span className="font-medium text-foreground">{formatDate(subscriber.lastPaymentDate)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("subscriber.validUntil")}:</span>
            <span className={`font-medium ${subscriber.status === "overdue" ? "text-status-overdue" : "text-foreground"}`}>
              {formatDate(subscriber.validUntil)}
            </span>
          </div>
        </div>

        <div className="flex gap-1.5 pt-3 border-t border-border">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <Button size="sm" className="w-full px-3 text-xs whitespace-nowrap" onClick={() => onRecordPayment(subscriber)}>
              <CreditCard className="w-3.5 h-3.5 me-1 shrink-0" />
              {t("actions.recordPayment")}
            </Button>
            <Button variant="outline" size="sm" className="w-full px-3 text-xs whitespace-nowrap" onClick={() => onSendReminder(subscriber)}>
              <MessageSquare className="w-3.5 h-3.5 me-1 shrink-0" />
              {t("actions.sendMessage")}
            </Button>
          </div>
          {isAdmin && (
            <div className="flex flex-col gap-1 shrink-0">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onViewHistory(subscriber)}>
                <History className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onEdit?.(subscriber)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete?.(subscriber)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          {!isAdmin && (
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 self-start" onClick={() => onViewHistory(subscriber)}>
              <History className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
