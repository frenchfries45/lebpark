import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Pencil, Trash2, Check, X, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrencyForLocale, formatPlateForLocale } from "@/lib/formatNumbers";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  created_at: string;
  recorded_by_username: string | null;
}

interface PaymentHistoryDialogProps {
  subscriber: Subscriber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataChanged: () => void;
  isAdmin: boolean;
}

export function PaymentHistoryDialog({
  subscriber,
  open,
  onOpenChange,
  onDataChanged,
  isAdmin,
}: PaymentHistoryDialogProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [validityEnd, setValidityEnd] = useState("");
  const [editingValidity, setEditingValidity] = useState(false);

  useEffect(() => {
    if (open && subscriber) {
      fetchPayments();
      setValidityEnd(
        subscriber.validUntil
          ? format(subscriber.validUntil, "yyyy-MM-dd")
          : ""
      );
    }
  }, [open, subscriber]);

  const fetchPayments = async () => {
    if (!subscriber) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("subscriber_id", subscriber.id)
      .order("payment_date", { ascending: false });

    if (!error && data) {
      setPayments(data);
    }
    setLoading(false);
  };

  const handleStartEdit = (payment: Payment) => {
    setEditingId(payment.id);
    setEditAmount(payment.amount.toString());
    setEditDate(payment.payment_date);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from("payments")
      .update({
        amount: parseFloat(editAmount),
        payment_date: editDate,
      })
      .eq("id", editingId);

    if (error) {
      console.error("Error updating payment:", error);
      return;
    }

    toast({
      title: t("toast.paymentUpdated"),
      description: t("toast.paymentUpdatedDesc"),
    });

    setEditingId(null);
    fetchPayments();
    onDataChanged();
  };

  const handleDelete = async (paymentId: string) => {
    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", paymentId);

    if (error) {
      console.error("Error deleting payment:", error);
      return;
    }

    toast({
      title: t("toast.paymentDeleted"),
      description: t("toast.paymentDeletedDesc"),
    });

    fetchPayments();
    onDataChanged();
  };

  const handleSaveValidity = async () => {
    if (!subscriber) return;

    const { error } = await supabase
      .from("subscribers")
      .update({
        validity_end: validityEnd || null,
      })
      .eq("id", subscriber.id);

    if (error) {
      console.error("Error updating validity:", error);
      return;
    }

    toast({
      title: t("toast.validityUpdated"),
      description: t("toast.validityUpdatedDesc"),
    });

    setEditingValidity(false);
    onDataChanged();
  };

  if (!subscriber) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("dialog.paymentHistory")}</DialogTitle>
        </DialogHeader>

        {/* Subscriber info */}
        <div className="bg-secondary/50 rounded-lg p-4 space-y-1">
          <p className="font-medium text-foreground">{subscriber.name}</p>
          <p className="text-sm text-muted-foreground">
            {t("subscriber.plate")}: {formatPlateForLocale(subscriber.vehiclePlate, i18n.language)}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("subscriber.monthlyFee")}: {formatCurrencyForLocale(subscriber.monthlyFee, i18n.language)}
          </p>
        </div>

        {/* Validity section */}
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <Label className="font-medium">{t("subscriber.validUntil")}</Label>
            </div>
            {!editingValidity && isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingValidity(true)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {editingValidity ? (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={validityEnd}
                onChange={(e) => setValidityEnd(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" variant="ghost" onClick={handleSaveValidity}>
                <Check className="w-4 h-4 text-status-paid" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingValidity(false)}
              >
                <X className="w-4 h-4 text-status-overdue" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-foreground">
              {subscriber.validUntil
                ? format(subscriber.validUntil, "MMMM dd, yyyy")
                : t("subscriber.notYetPaid")}
            </p>
          )}
        </div>

        {/* Payment list */}
        <div className="space-y-2">
          <Label className="font-medium">{t("dialog.payments")}</Label>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("dialog.noPayments")}
            </p>
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border border-border rounded-lg p-3"
                >
                  {editingId === payment.id ? (
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <Input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-24"
                        min="0"
                        step="0.01"
                      />
                      <Input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-40"
                      />
                      <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                        <Check className="w-4 h-4 text-status-paid" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-4 h-4 text-status-overdue" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {formatCurrencyForLocale(payment.amount, i18n.language)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.payment_date), "MMM dd, yyyy")}
                        </p>
                        {payment.recorded_by_username && (
                          <p className="text-xs text-muted-foreground/70">
                            {t("dialog.recordedBy", { user: payment.recorded_by_username })}
                          </p>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(payment)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(payment.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-status-overdue" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
