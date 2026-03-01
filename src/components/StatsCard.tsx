import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { formatNumberForLocale, formatCurrencyForLocale } from "@/lib/formatNumbers";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  isCurrency?: boolean;
  className?: string;
}

const variantStyles = {
  default: "bg-accent text-accent-foreground",
  success: "bg-status-paid-bg text-status-paid",
  warning: "bg-status-pending-bg text-status-pending",
  danger: "bg-status-overdue-bg text-status-overdue",
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  isCurrency = false,
  className,
}: StatsCardProps) {
  const { i18n } = useTranslation();

  const formattedValue =
    typeof value === "number"
      ? isCurrency
        ? formatCurrencyForLocale(value, i18n.language)
        : formatNumberForLocale(value, i18n.language)
      : value;

  return (
    <Card className={cn("overflow-hidden animate-fade-in", className)}>
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-tight truncate">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1 leading-none">{formattedValue}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${variantStyles[variant]}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
