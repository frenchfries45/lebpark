import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { PaymentStatus } from "@/types/subscriber";

interface StatusBadgeProps {
  status: PaymentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  
  const statusConfig = {
    paid: {
      label: t("status.paid"),
      variant: "paid" as const,
    },
    pending: {
      label: t("status.pending"),
      variant: "pending" as const,
    },
    overdue: {
      label: t("status.overdue"),
      variant: "overdue" as const,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="font-medium">
      {config.label}
    </Badge>
  );
}
