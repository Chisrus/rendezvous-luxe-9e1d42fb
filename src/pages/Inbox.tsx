import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MessageCircle, Bell, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string | null;
  receiver_id: string | null;
  profile_sender_id: string | null;
  profile_receiver_id: string | null;
  read: boolean | null;
}

interface Profile {
  id: string;
  name: string;
  photo_url: string | null;
}

const Inbox = () => {
  const { user, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<{ profile: Profile; lastMessage: Message; unread: number }[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const unreadNotifs = useUnreadNotifications();
  const unreadMsgs = useUnreadMessages();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  // Load all profiles for name lookup
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id, name, photo_url").then(({ data }) => {
      if (data) {
        const map: Record<string, Profile> = {};
        data.forEach(p => { map[p.id] = p; });
        setProfiles(map);
      }
    });
  }, [user]);

  // Load conversations
  useEffect(() => {
    if (!user || Object.keys(profiles).length === 0) return;

    const loadConversations = async () => {
      // Get messages where this user is sender or receiver
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!msgs) return;

      // Group by the other profile
      const convMap = new Map<string, { profile: Profile; lastMessage: Message; unread: number }>();

      for (const m of msgs) {
        // Determine the profile on the other side
        let profileId: string | null = null;
        if (m.sender_id === user.id) {
          profileId = m.profile_receiver_id;
        } else if (m.receiver_id === user.id) {
          profileId = m.profile_sender_id;
        }

        if (!profileId || !profiles[profileId]) continue;

        if (!convMap.has(profileId)) {
          convMap.set(profileId, {
            profile: profiles[profileId],
            lastMessage: m,
            unread: 0,
          });
        }

        const conv = convMap.get(profileId)!;
        if (m.receiver_id === user.id && !m.read) {
          conv.unread++;
        }
      }

      setConversations(Array.from(convMap.values()));
    };

    loadConversations();
  }, [user, profiles]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!user || !selectedProfile) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},profile_receiver_id.eq.${selectedProfile.id}),and(receiver_id.eq.${user.id},profile_sender_id.eq.${selectedProfile.id})`
        )
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data);
        // Mark as read
        const unreadIds = data.filter(m => m.receiver_id === user.id && !m.read).map(m => m.id);
        if (unreadIds.length > 0) {
          await supabase.from("messages").update({ read: true }).in("id", unreadIds);
        }
      }
    };

    loadMessages();

    const channel = supabase
      .channel(`inbox-${selectedProfile.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
      }, (payload) => {
        const m = payload.new as Message;
        if (
          (m.sender_id === user.id && m.profile_receiver_id === selectedProfile.id) ||
          (m.receiver_id === user.id && m.profile_sender_id === selectedProfile.id)
        ) {
          setMessages(prev => [...prev, m]);
          if (m.receiver_id === user.id) {
            supabase.from("messages").update({ read: true }).eq("id", m.id).then(() => {});
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedProfile]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedProfile) return;

    await supabase.from("messages").insert({
      content: newMessage.trim(),
      sender_id: user.id,
      profile_receiver_id: selectedProfile.id,
      receiver_id: null,
      profile_sender_id: null,
    });

    setNewMessage("");
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold tracking-wide">
            <span className="text-primary font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Rencontre</span>
            <span className="text-foreground font-light">DeLuxe</span>
          </a>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => navigate("/profiles")} className="text-muted-foreground">
              Profils
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate("/inbox")} className="relative text-muted-foreground">
              <MessageCircle className="w-4 h-4 mr-1" /> Messages
              {unreadMsgs > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                  {unreadMsgs > 9 ? "9+" : unreadMsgs}
                </span>
              )}
            </Button>
            <div className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </div>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => navigate("/admin")} className="rounded-full border-primary/30 text-primary">
                <Shield className="w-4 h-4 mr-1" /> Admin
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={signOut} className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 px-6 max-w-4xl mx-auto">
        {!selectedProfile ? (
          <>
            <h1 className="text-3xl font-bold text-foreground mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              <MessageCircle className="w-7 h-7 inline mr-2 text-primary" />
              Mes <span className="text-primary">Messages</span>
            </h1>
            {conversations.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-primary/30" />
                <p>Aucun message pour le moment.</p>
                <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate("/profiles")}>
                  Découvrir des profils
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map(conv => (
                  <button
                    key={conv.profile.id}
                    onClick={() => setSelectedProfile(conv.profile)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/40 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                      {conv.profile.photo_url ? (
                        <img src={conv.profile.photo_url} alt={conv.profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-light text-muted-foreground">{conv.profile.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">{conv.profile.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.lastMessage.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage.content}</p>
                    </div>
                    {conv.unread > 0 && (
                      <Badge className="bg-primary text-primary-foreground shrink-0">{conv.unread}</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => setSelectedProfile(null)} className="mb-4 text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour
            </Button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {selectedProfile.photo_url ? (
                  <img src={selectedProfile.photo_url} alt={selectedProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-light text-muted-foreground">{selectedProfile.name[0]}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                {selectedProfile.name}
              </h2>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-4 mb-4 h-[400px] overflow-y-auto space-y-3">
              {messages.map(m => {
                const isMine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    }`}>
                      {m.content}
                      <div className={`text-xs mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Votre message..."
                className="flex-1 px-4 py-3 rounded-full bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <Button onClick={sendMessage} className="rounded-full bg-primary text-primary-foreground px-6">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Inbox;
