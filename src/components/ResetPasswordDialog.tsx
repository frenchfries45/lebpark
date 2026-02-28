import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyRound } from "lucide-react";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ open, onOpenChange }: ResetPasswordDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^[a-zA-Z]{5,10}$/.test(username)) {
      toast({
        title: t("auth.error"),
        description: t("auth.invalidUsername"),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t("auth.error"),
        description: t("auth.passwordTooShort"),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.functions.invoke("reset-password", {
      body: { username, new_password: newPassword },
    });

    if (error || data?.error) {
      const msg = data?.error || error?.message || "Unknown error";
      toast({
        title: t("auth.error"),
        description: msg,
        variant: "destructive",
      });
    } else {
      toast({
        title: t("admin.passwordReset"),
        description: t("admin.passwordResetDesc", { username: username.toLowerCase() }),
      });
      setUsername("");
      setNewPassword("");
      onOpenChange(false);
    }

    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.resetPassword")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-username">{t("auth.username")}</Label>
            <Input
              id="reset-username"
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 10))
              }
              placeholder={t("auth.usernamePlaceholder")}
              required
              minLength={5}
              maxLength={10}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-new-password">{t("admin.newPassword")}</Label>
            <Input
              id="reset-new-password"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? (
                <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              {t("admin.resetPassword")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
