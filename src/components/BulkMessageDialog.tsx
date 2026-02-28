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

export function BulkMessageDialog({ overdueSubscribers, currentUserId, currentUsername }: BulkMessageDialogProps) {
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

  const formatPhoneForWhatsApp = (phone: string) =>
    phone.replace(/[^\d+]/g, "").replace(/^\+/, "");

  const handleWhatsAppBulk = () => {
    overdueSubscribers.forEach((subscriber, index) => {
      const message = encodeURIComponent(formatMessage(subscriber));
      const phone = formatPhoneForWhatsApp(subscriber.phone);
      setTimeout(() => {
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
      }, index * 500);
    });
    toast({
      title: t("toast.whatsappInitiated"),
      description: t("toast.whatsappInitiatedDesc", { count: overdueSubscribers.length }),
    });
    setOpen(false);
  };

  const handleQueueAllSMS = async () => {
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
      description: `${successCount} message(s) queued and will be sent soon.`,
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

          <div className="space-y-2">
            <Label>{t("bulk.preview")}</Label>
            <div className="bg-secondary/50 rounded-lg p-3 text-sm">
              {overdueSubscribers[0] && formatMessage(overdueSubscribers[0])}
            </div>
          </div>

          <div className="bg-accent/50 border border-accent rounded-lg p-3 text-xs text-accent-foreground">
            📋 SMS messages will be queued and sent manually shortly.
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" className="gap-2" onClick={handleWhatsAppBulk}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t("actions.whatsappAll")}
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleQueueAllSMS} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              {sending ? t("actions.sending") : "Queue SMS All"}
            </Button>
          </div>

          <Button variant="ghost" size="sm" className="w-full" onClick={copyAllPhones}>
            {t("actions.copyPhones")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
