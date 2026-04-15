import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";
import UserNavbar from "@/components/UserNavbar";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const UserNotifications = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setNotifications(data);
    };
    load();

    const channel = supabase
      .channel("notif-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />
      <div className="pt-24 px-6 max-w-3xl mx-auto pb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            <Bell className="w-7 h-7 inline mr-2 text-primary" />
            Notifications
          </h1>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllRead} className="rounded-full text-xs">
              <Check className="w-3 h-3 mr-1" /> Tout marquer comme lu
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 text-primary/30" />
            <p>Aucune notification.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-colors ${
                  n.read ? "bg-card border-border/50" : "bg-primary/5 border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{n.title}</p>
                    <p className="text-muted-foreground text-sm mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(n.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  {!n.read && (
                    <Button size="sm" variant="ghost" onClick={() => markAsRead(n.id)} className="text-primary text-xs shrink-0">
                      <Check className="w-3 h-3 mr-1" /> Lu
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserNotifications;
