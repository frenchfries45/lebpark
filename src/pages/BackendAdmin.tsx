import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { usePendingMessages, PendingMessage } from "@/hooks/usePendingMessages";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Phone, MessageSquare, CheckCircle2, Clock, LogOut, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function BackendAdmin() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user?.id);
  const { messages, loading, markAsSent, refetch } = usePendingMessages();
  const { toast } = useToast();
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && role && role !== "backend_admin") {
      navigate("/", { replace: true });
    }
  }, [role, roleLoading, navigate]);

  const handleMarkSent = async (msg: PendingMessage) => {
    setMarkingId(msg.id);
    const profile = user?.email?.split("@")[0] || "backend_admin";
    const ok = await markAsSent(msg.id, profile);
    if (ok) {
      toast({ title: "Marked as Sent", description: `Message for ${msg.subscriberName} marked as sent.` });
    }
    setMarkingId(null);
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <MessageSquare className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">PARKleb — Message Queue</h1>
              <p className="text-sm text-muted-foreground">Pending messages to send manually</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">Backend Admin</Badge>
            <Button variant="outline" size="icon" onClick={refetch} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign Out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Summary */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">
              {loading ? "..." : messages.length} pending message{messages.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Send each message manually, then mark it as sent.
          </p>
        </div>

        {/* Messages list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle2 className="w-12 h-12 text-status-paid mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">All clear!</h3>
            <p className="text-muted-foreground mt-1">No pending messages right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {messages.map((msg) => (
              <Card key={msg.id} className="animate-fade-in">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{msg.subscriberName}</CardTitle>
                    <Badge variant={msg.isBulk ? "secondary" : "outline"} className="text-xs shrink-0 ml-2">
                      {msg.isBulk ? "Bulk" : "Individual"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requested by <span className="font-medium">{msg.requestedByUsername}</span>
                    {" · "}
                    {format(msg.createdAt, "MMM d, HH:mm")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <a
                        href={`tel:${msg.subscriberPhone}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {msg.subscriberPhone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground">{msg.vehiclePlate}</span>
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="bg-muted rounded-lg p-3 text-xs text-foreground leading-relaxed">
                    {msg.message}
                  </div>

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        const phone = msg.subscriberPhone.replace(/[^\d+]/g, "").replace(/^\+/, "");
                        const text = encodeURIComponent(msg.message);
                        window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-green-600">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => navigator.clipboard.writeText(msg.message)}
                    >
                      Copy Msg
                    </Button>
                  </div>

                  {/* Mark as sent */}
                  <Button
                    className="w-full gap-2"
                    size="sm"
                    disabled={markingId === msg.id}
                    onClick={() => handleMarkSent(msg)}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {markingId === msg.id ? "Marking..." : "Mark as Sent"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
