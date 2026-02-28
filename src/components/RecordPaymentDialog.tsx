import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Subscriber } from "@/types/subscriber";
import { format } from "date-fns";
import { useState } from "react";
import { formatPlateForLocale, formatCurrencyForLocale } from "@/lib/formatNumbers";

interface RecordPaymentDialogProps {
  subscriber: Subscriber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordPayment: (subscriberId: string, amount: number) => void;
}

export function RecordPaymentDialog({
  subscriber,
  open,
  onOpenChange,
  onRecordPayment,
}: RecordPaymentDialogProps) {
  const { t, i18n } = useTranslation();
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscriber) {
      onRecordPayment(subscriber.id, parseFloat(amount));
      setAmount("");
      onOpenChange(false);
    }
  };

  if (!subscriber) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialog.recordPayment")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <p className="font-medium text-foreground">{subscriber.name}</p>
            <p className="text-sm text-muted-foreground">
              {t("subscriber.plate")}: {formatPlateForLocale(subscriber.vehiclePlate, i18n.language)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("subscriber.monthlyFee")}: {formatCurrencyForLocale(subscriber.monthlyFee, i18n.language)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t("dialog.paymentAmount")} ($)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder={subscriber.monthlyFee.toString()}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t("dialog.paymentDate")}</Label>
            <Input value={format(new Date(), "MMMM dd, yyyy")} disabled />
            <p className="text-xs text-muted-foreground">
              {t("dialog.paymentValidUntil")}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit">{t("actions.recordPayment")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
