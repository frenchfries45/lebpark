import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, UserPlus, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateUserDialog } from "@/components/CreateUserDialog";
import { ResetPasswordDialog } from "@/components/ResetPasswordDialog";

export function ManageAccountsDropdown() {
  const { t } = useTranslation();
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            {t("admin.manageAccounts")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setCreateUserOpen(true)}>
            <UserPlus className="w-4 h-4 me-2" />
            {t("admin.createUser")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetPasswordOpen(true)}>
            <KeyRound className="w-4 h-4 me-2" />
            {t("admin.resetPassword")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateUserDialog open={createUserOpen} onOpenChange={setCreateUserOpen} />
      <ResetPasswordDialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen} />
    </>
  );
}
