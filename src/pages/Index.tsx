import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { usePendingMessages } from "@/hooks/usePendingMessages";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscribers } from "@/hooks/useSubscribers";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { useMonthlyStats } from "@/hooks/useMonthlyStats";
import { SubscriberCard } from "@/components/SubscriberCard";
import { MonthSelector } from "@/components/MonthSelector";
import { ActivityLogComponent } from "@/components/ActivityLog";
import { StatsCard } from "@/components/StatsCard";
import { AddSubscriberDialog } from "@/components/AddSubscriberDialog";
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog";
import { PaymentHistoryDialog } from "@/components/PaymentHistoryDialog";
import { SendMessageDialog } from "@/components/SendMessageDialog";
import { BulkMessageDialog } from "@/components/BulkMessageDialog";
import { EditSubscriberDialog } from "@/components/EditSubscriberDialog";
import { DeleteSubscriberDialog } from "@/components/DeleteSubscriberDialog";
import { ManageAccountsDropdown } from "@/components/ManageAccountsDropdown";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Subscriber } from "@/types/subscriber";
import { Users, CheckCircle, Clock, AlertCircle, DollarSign, Car, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrencyForLocale } from "@/lib/formatNumbers";

const Index = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isBackendAdmin, loading: roleLoading } = useUserRole(user?.id);
  const { subscribers, loading, addSubscriber, updateSubscriber, deleteSubscriber, recordPayment, refetch } = useSubscribers();
  const { logs, loading: logsLoading, addLog } = useActivityLogs();
  const { selectedDate, setSelectedDate, isCurrentMonth, stats, loading: statsLoading } = useMonthlyStats(subscribers);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [currentUsername, setCurrentUsername] = useState("unknown");
  const { messages: pendingMessages } = usePendingMessages();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && isBackendAdmin) {
      navigate("/backend", { replace: true });
    }
  }, [isBackendAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (user) {
      getUserProfile().then((p) => {
        if (p?.username || p?.display_name) {
          setCurrentUsername(p.username || p.display_name || "unknown");
        }
      });
    }
  }, [user]);

  const filteredSubscribers = subscribers.filter((subscriber) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      subscriber.name.toLowerCase().includes(query) ||
      subscriber.vehiclePlate.toLowerCase().includes(query) ||
      subscriber.car.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || subscriber.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendMessage = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setMessageDialogOpen(true);
  };

  const handleRecordPayment = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setPaymentDialogOpen(true);
  };

  const handleViewHistory = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setHistoryDialogOpen(true);
  };

  const handleEdit = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setEditDialogOpen(true);
  };

  const handleDelete = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setDeleteDialogOpen(true);
  };

  const getUserProfile = async () => {
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("user_id", user.id)
      .single();
    return data;
  };

  const handlePaymentSubmit = async (subscriberId: string, amount: number) => {
    const profile = user ? await getUserProfile() : null;
    const username = profile?.username || profile?.display_name || "unknown";
    await recordPayment(subscriberId, amount, username);
    
    const subscriber = subscribers.find(s => s.id === subscriberId);
    if (subscriber && user) {
      await addLog({
        actionType: "payment_recorded",
        performedByUserId: user.id,
        performedByUsername: username,
        subscriberId: subscriber.id,
        subscriberName: subscriber.name,
        amount,
      });
    }

    toast({
      title: t("toast.paymentRecorded"),
      description: t("toast.paymentRecordedDesc", { amount }),
    });
  };

  const handleAddSubscriber = async (data: Omit<Subscriber, "id" | "createdAt" | "status">) => {
    await addSubscriber(data);
    if (user) {
      const profile = await getUserProfile();
      await addLog({
        actionType: "subscriber_added",
        performedByUserId: user.id,
        performedByUsername: profile?.username || profile?.display_name || "unknown",
        subscriberName: data.name,
      });
    }
    toast({
      title: t("toast.subscriberAdded"),
      description: t("toast.subscriberAddedDesc", { name: data.name }),
    });
  };

  const handleEditSave = async (id: string, data: { name: string; phone: string; car: string; vehiclePlate: string; monthlyFee: number }) => {
    await updateSubscriber(id, data);
    toast({
      title: t("toast.subscriberUpdated"),
      description: t("toast.subscriberUpdatedDesc", { name: data.name }),
    });
  };

  const handleDeleteConfirm = async (id: string) => {
    await deleteSubscriber(id);
    toast({
      title: t("toast.subscriberDeleted"),
      description: t("toast.subscriberDeletedDesc"),
    });
    setDeleteDialogOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 bg-primary rounded-lg shrink-0">
                <Car className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-foreground leading-tight">{t("app.name")}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">{t("app.description")}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Badge variant={isAdmin ? "default" : "secondary"} className="hidden md:inline-flex text-xs">
                {isAdmin ? t("auth.admin") : t("auth.employee")}
              </Badge>
              {isAdmin && <ManageAccountsDropdown />}
              <LanguageSwitcher />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title={t("auth.signOut")}
                className="h-9 w-9"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 sm:pb-6">
        {/* Month Selector + Stats Grid */}
        <div className="space-y-3 sm:space-y-4">
          <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          {/* Stats: 2 cols on mobile, 3 on tablet, 5 on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
            <StatsCard title={t("stats.totalSubscribers")} value={statsLoading ? "..." : stats.total} icon={Users} variant="default" />
            <StatsCard title={t("stats.paid")} value={statsLoading ? "..." : stats.paid} icon={CheckCircle} variant="success" />
            <StatsCard title={t("stats.pending")} value={statsLoading ? "..." : stats.pending} icon={Clock} variant="warning" />
            <StatsCard title={t("stats.overdue")} value={statsLoading ? "..." : stats.overdue} icon={AlertCircle} variant="danger" />
            <StatsCard
              title={t("stats.monthlyRevenue")}
              value={statsLoading ? "..." : formatCurrencyForLocale(stats.monthlyRevenue, i18n.language)}
              subtitle={t("stats.fromPaidSubscribers")}
              icon={DollarSign}
              variant="success"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>

        {/* Activity Log */}
        <ActivityLogComponent logs={logs} loading={logsLoading} />

        {/* Filters and Actions */}
        <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          {/* Search + Filter row */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("filters.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 w-full sm:w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] sm:w-36 shrink-0">
                <SelectValue placeholder={t("filters.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allStatus")}</SelectItem>
                <SelectItem value="paid">{t("status.paid")}</SelectItem>
                <SelectItem value="pending">{t("status.pending")}</SelectItem>
                <SelectItem value="overdue">{t("status.overdue")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action buttons row */}
          <div className="flex gap-2">
            <BulkMessageDialog
              overdueSubscribers={subscribers.filter(s => s.status === "overdue")}
              currentUserId={user?.id || ""}
              currentUsername={currentUsername}
            />
            <AddSubscriberDialog onAdd={handleAddSubscriber} />
          </div>
        </div>

        {/* Subscriber Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">{t("loading.subscribers")}</p>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">{t("empty.noSubscribersFound")}</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? t("empty.adjustSearch")
                : t("empty.addFirst")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredSubscribers.map((subscriber) => (
              <SubscriberCard
                key={subscriber.id}
                subscriber={subscriber}
                isAdmin={isAdmin}
                hasPendingMessage={pendingMessages.some(m => m.subscriberId === subscriber.id)}
                onSendReminder={handleSendMessage}
                onRecordPayment={handleRecordPayment}
                onViewHistory={handleViewHistory}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <RecordPaymentDialog
        subscriber={selectedSubscriber}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onRecordPayment={handlePaymentSubmit}
      />
      <PaymentHistoryDialog
        subscriber={selectedSubscriber}
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        onDataChanged={refetch}
        isAdmin={isAdmin}
      />
      <SendMessageDialog
        subscriber={selectedSubscriber}
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        currentUserId={user?.id || ""}
        currentUsername={currentUsername}
      />
      <EditSubscriberDialog
        subscriber={selectedSubscriber}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleEditSave}
      />
      <DeleteSubscriberDialog
        subscriber={selectedSubscriber}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default Index;
