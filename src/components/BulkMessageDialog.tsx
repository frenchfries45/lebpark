import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Subscriber } from "@/types/subscriber";
import { MessageSquare, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePendingMessages } from "@/hooks/usePendingMessages";

interface BulkMessageDialogProps {
  overdueSubscribers: Subscriber[];
  currentUserId: string;
  currentUsername: string;
}

export function BulkMessageDialog({
  overdueSubscribers,
  currentUserId,
  currentUsername,
}: BulkMessageDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState(
    "Hi {name}, your parking subscription is overdue. Please make your payment of ${fee} at your earliest convenience. Thank you!"
  );
  const { toast } = useToast();
  const { addPendingMessage } = usePendingMessages();

  const formatMessage = (subscriber: Subscriber) =>
    messageTemplate
      .replace("{name}", subscriber.name)
      .replace("{fee}", subscriber.monthlyFee.toString())
      .replace("{plate}", subscriber.vehiclePlate);

  // Queue all overdue subscribers as pending SMS requests for backend
  const handleQueueAll = async () => {
    setSending(true);
    let successCount = 0;
    for (const subscriber of overdueSubscribers) {
      const ok = await addPendingMessage({
        subscriberId: subscriber.id,
        subscriberName: subscriber.name,
        subscriberPhone: subscriber.phone,
        vehiclePlate: subscriber.vehiclePlate,
        message: formatMessage(subscriber),
        requestedByUserId: currentUserId,
        requestedByUsername: currentUsername,
        isBulk: true,
      });
      if (ok) successCount++;
    }
    toast({
      title: "Messages Queued",
      description: `${successCount} message(s) sent to the backend queue to be processed.`,
    });
    setSending(false);
    setOpen(false);
  };

  const copyAllPhones = () => {
    const phones = overdueSubscribers.map((s) => `${s.name}: ${s.phone}`).join("\n");
    navigator.clipboard.writeText(phones);
    toast({
      title: t("toast.phonesCopied"),
      description: t("toast.phonesCopiedDesc", { count: overdueSubscribers.length }),
    });
  };

  if (overdueSubscribers.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          {t("actions.messageOverdue")} ({overdueSubscribers.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("dialog.messageOverdueSubscribers")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Overdue list */}
          <div className="bg-status-overdue-bg border border-status-overdue/20 rounded-lg p-3">
            <p className="text-sm font-medium text-status-overdue">
              {overdueSubscribers.length} {t("bulk.subscribersOverdue")}
            </p>
            <div className="mt-2 max-h-24 overflow-y-auto">
              {overdueSubscribers.map((s) => (
                <p key={s.id} className="text-xs text-muted-foreground">
                  {s.name} - {s.phone}
                </p>
              ))}
            </div>
          </div>

          {/* Message template */}
          <div className="space-y-2">
            <Label htmlFor="template">{t("bulk.messageTemplate")}</Label>
            <Textarea
              id="template"
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {t("bulk.availableVariables")}: {"{name}"}, {"{fee}"}, {"{plate}"}
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>{t("bulk.preview")}</Label>
            <div className="bg-secondary/50 rounded-lg p-3 text-sm">
              {overdueSubscribers[0] && formatMessage(overdueSubscribers[0])}
            </div>
          </div>

          <div className="bg-accent/50 border border-accent rounded-lg p-3 text-xs text-accent-foreground">
            📋 Messages will be queued for the backend to send via SMS.
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              className="gap-2"
              onClick={handleQueueAll}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              {sending ? t("actions.sending") : "Queue SMS for All"}
            </Button>
            <Button variant="outline" onClick={copyAllPhones}>
              {t("actions.copyPhones")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
