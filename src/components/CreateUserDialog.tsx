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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"employee" | "admin">("employee");
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

    if (password.length < 6) {
      toast({
        title: t("auth.error"),
        description: t("auth.passwordTooShort"),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.functions.invoke("create-user", {
      body: { username, password, role },
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
        title: t("admin.userCreated"),
        description: t("admin.userCreatedDesc", { username: username.toLowerCase() }),
      });
      setUsername("");
      setPassword("");
      setRole("employee");
      onOpenChange(false);
    }

    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.createUser")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-username">{t("auth.username")}</Label>
            <Input
              id="new-username"
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
            <Label htmlFor="new-password">{t("auth.password")}</Label>
            <Input
              id="new-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("auth.role")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "employee" | "admin")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">{t("auth.employee")}</SelectItem>
                <SelectItem value="admin">{t("auth.admin")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? (
                <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {t("admin.createUser")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
