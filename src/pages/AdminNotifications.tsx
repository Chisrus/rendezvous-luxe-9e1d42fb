import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";

interface RealUser {
  id: string;
  name: string;
  created_by: string;
}

const AdminNotifications = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [realUsers, setRealUsers] = useState<RealUser[]>([]);
  const [targetUser, setTargetUser] = useState<string>("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/", { replace: true });
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      supabase.from("profiles").select("id, name, created_by").order("name")
        .then(({ data }) => {
          if (data) setRealUsers(data.filter(p => p.id === p.created_by));
        });

      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)
        .then(({ data }) => {
          if (data) setSentNotifications(data);
        });
    }
  }, [isAdmin]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser || !title.trim() || !message.trim()) return;
    setSending(true);

    try {
      const targets = targetUser === "all"
        ? realUsers.map(u => u.created_by)
        : [targetUser];

      const inserts = targets.map(uid => ({
        user_id: uid,
        title: title.trim(),
        message: message.trim(),
      }));

      const { error } = await supabase.from("notifications").insert(inserts as any);
      if (error) throw error;

      toast({ title: "✅ Notification envoyée", description: `Envoyée à ${targets.length} utilisateur(s).` });
      setTitle("");
      setMessage("");
      setTargetUser("");

      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
      if (data) setSentNotifications(data);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading || !user || !isAdmin) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            <Bell className="inline w-6 h-6 mr-2 text-primary" />
            Notifications Push
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Envoyez des notifications pop-up aux utilisateurs en temps réel.</p>
        </div>

        <form onSubmit={handleSend} className="bg-card border border-border/50 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="space-y-2">
            <Label className="text-foreground">Destinataire</Label>
            <Select value={targetUser} onValueChange={setTargetUser}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Sélectionnez un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📢 Tous les utilisateurs</SelectItem>
                {realUsers.map(u => (
                  <SelectItem key={u.created_by} value={u.created_by}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Titre</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Bienvenue sur RencontreDeLuxe !"
              className="bg-background border-border/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Message</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tapez votre message ici..."
              className="bg-background border-border/50"
              rows={3}
              required
            />
          </div>

          <Button type="submit" disabled={sending || !targetUser || !title.trim() || !message.trim()} className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/85 font-semibold">
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Envoi en cours..." : "Envoyer la notification"}
          </Button>
        </form>

        {sentNotifications.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Historique</h2>
            {sentNotifications.map(n => (
              <div key={n.id} className="bg-card border border-border/50 rounded-xl p-4 flex items-start gap-3">
                <Bell className="w-4 h-4 text-primary mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{n.title}</p>
                  <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {new Date(n.created_at).toLocaleString("fr-FR")}
                    {n.read ? " • Lu ✓" : " • Non lu"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
