import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { formatNumberForLocale, formatCurrencyForLocale } from "@/lib/formatNumbers";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  isCurrency?: boolean;
}

const variantStyles = {
  default: "bg-accent text-accent-foreground",
  success: "bg-status-paid-bg text-status-paid",
  warning: "bg-status-pending-bg text-status-pending",
  danger: "bg-status-overdue-bg text-status-overdue",
};

export function StatsCard({ title, value, subtitle, icon: Icon, variant = "default", isCurrency = false }: StatsCardProps) {
  const { i18n } = useTranslation();
  
  const formattedValue = typeof value === 'number' 
    ? (isCurrency ? formatCurrencyForLocale(value, i18n.language) : formatNumberForLocale(value, i18n.language))
    : value;

  return (
    <Card className="overflow-hidden animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formattedValue}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-lg ${variantStyles[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
