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
      <CardContent className="p-4 sm:p-5">
        {/* Header: name + status */}
        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-base sm:text-lg leading-snug">{subscriber.name}</h3>
              {hasPendingMessage && (
                <Badge variant="secondary" className="gap-1 text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                  <Clock className="w-3 h-3" />
                  <span className="hidden xs:inline">Message</span> Pending
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-0.5">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{formatPhoneForLocale(subscriber.phone, i18n.language)}</span>
            </div>
          </div>
          <StatusBadge status={subscriber.status} />
        </div>

        {/* Details grid - more compact on mobile */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-4 text-sm">
          <div className="flex items-center gap-1.5 min-w-0">
            <Car className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground shrink-0">{t("subscriber.car")}:</span>
            <span className="font-medium text-foreground truncate">{subscriber.car}</span>
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <Car className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground shrink-0">{t("subscriber.plate")}:</span>
            <span className="font-medium text-foreground truncate">
              {formatPlateForLocale(subscriber.vehiclePlate, i18n.language)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 col-span-2 min-w-0">
            <CreditCard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground shrink-0">{t("subscriber.monthlyFee")}:</span>
            <span className="font-medium text-foreground">
              {formatCurrencyForLocale(subscriber.monthlyFee, i18n.language)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground shrink-0 hidden sm:inline">{t("subscriber.lastPaid")}:</span>
            <span className="text-muted-foreground shrink-0 sm:hidden">Paid:</span>
            <span className="font-medium text-foreground text-xs sm:text-sm truncate">{formatDate(subscriber.lastPaymentDate)}</span>
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground shrink-0 hidden sm:inline">{t("subscriber.validUntil")}:</span>
            <span className="text-muted-foreground shrink-0 sm:hidden">Until:</span>
            <span className={`font-medium text-xs sm:text-sm truncate ${subscriber.status === "overdue" ? "text-status-overdue" : "text-foreground"}`}>
              {formatDate(subscriber.validUntil)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-3 border-t border-border" role="group">
          {/* Primary actions - stack on very small, side by side otherwise */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <Button
              size="sm"
              className="w-full h-10 text-sm font-medium"
              onClick={() => onRecordPayment(subscriber)}
            >
              <CreditCard className="w-4 h-4 me-1.5 shrink-0" />
              {t("actions.recordPayment")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-10 text-sm"
              onClick={() => onSendReminder(subscriber)}
            >
              <MessageSquare className="w-4 h-4 me-1.5 shrink-0" />
              {t("actions.sendMessage")}
            </Button>
          </div>

          {/* Secondary icon actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => onViewHistory(subscriber)}
              title={t("actions.viewHistory")}
            >
              <History className="w-4 h-4" />
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => onEdit?.(subscriber)}
                  title={t("actions.edit")}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                  onClick={() => onDelete?.(subscriber)}
                  title={t("actions.delete")}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
