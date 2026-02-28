import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Subscriber } from "@/types/subscriber";
import { useToast } from "@/hooks/use-toast";
import { usePendingMessages } from "@/hooks/usePendingMessages";
import { MessageSquare } from "lucide-react";

interface SendMessageDialogProps {
  subscriber: Subscriber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  currentUsername: string;
}

export function SendMessageDialog({
  subscriber,
  open,
  onOpenChange,
  currentUserId,
  currentUsername,
}: SendMessageDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { addPendingMessage } = usePendingMessages();
  const [sending, setSending] = useState(false);

  if (!subscriber) return null;

  const message = `Hello ${subscriber.name}, your parking subscription is overdue. Please make your payment of $${subscriber.monthlyFee} at your earliest convenience. Vehicle: ${subscriber.vehiclePlate}. Thank you!`;

  const handleSend = async () => {
    setSending(true);
    const success = await addPendingMessage({
      subscriberId: subscriber.id,
      subscriberName: subscriber.name,
      subscriberPhone: subscriber.phone,
      vehiclePlate: subscriber.vehiclePlate,
      message,
      requestedByUserId: currentUserId,
      requestedByUsername: currentUsername,
      isBulk: false,
    });

    if (success) {
      toast({
        title: "Message Queued",
        description: `Message for ${subscriber.name} will be sent soon.`,
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Error",
        description: "Could not queue the message. Please try again.",
        variant: "destructive",
      });
    }
    setSending(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("dialog.sendMessage")}</AlertDialogTitle>
          <AlertDialogDescription>
            The following message will be sent to {subscriber.name}:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 my-2">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Message Preview
            </p>
            <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-line text-foreground">
              {message}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Will be sent to:{" "}
            <span className="font-medium text-foreground">{subscriber.phone}</span>
          </p>
          <div className="bg-accent/50 border border-accent rounded-lg p-3 text-xs text-accent-foreground">
            📋 This message will be queued and sent by the team shortly.
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={sending}>{t("actions.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleSend} disabled={sending} className="gap-2">
            <MessageSquare className="w-4 h-4" />
            {sending ? "Queuing..." : "Send Message"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
