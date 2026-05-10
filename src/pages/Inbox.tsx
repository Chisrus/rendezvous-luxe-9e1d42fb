import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UserNavbar from "@/components/UserNavbar";

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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<{ profile: Profile; lastMessage: Message; unread: number }[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadedProfileIdRef = useRef<string | null>(null);

  const selectProfile = (profile: Profile) => {
    setSelectedProfile((prev) => (prev && prev.id === profile.id ? prev : profile));
  };

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  // Auto-select profile from query params
  useEffect(() => {
    const profileId = searchParams.get("profileId");
    const profileName = searchParams.get("profileName");
    if (profileId && profileName) {
      setSelectedProfile((prev) => {
        if (prev && prev.id === profileId) return prev;
        return {
          id: profileId,
          name: profileName,
          photo_url: searchParams.get("profilePhoto") || null,
        };
      });
    }
  }, [searchParams]);

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
  const loadConversations = async () => {
    if (!user || Object.keys(profiles).length === 0) return;

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!msgs) return;

    const convMap = new Map<string, { profile: Profile; lastMessage: Message; unread: number }>();

    for (const m of msgs) {
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

  useEffect(() => {
    loadConversations();
  }, [user, profiles]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!user || !selectedProfile) return;
    if (loadedProfileIdRef.current === selectedProfile.id) {
      // Already loaded; subscription below will handle new messages
    }
    const isSameProfile = loadedProfileIdRef.current === selectedProfile.id;
    loadedProfileIdRef.current = selectedProfile.id;

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
        const unreadIds = data.filter(m => m.receiver_id === user.id && !m.read).map(m => m.id);
        if (unreadIds.length > 0) {
          await supabase.from("messages").update({ read: true }).in("id", unreadIds);
        }
      }
    };

    if (!isSameProfile) loadMessages();

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
  }, [user, selectedProfile?.id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedProfile) return;

    const content = newMessage.trim();
    setNewMessage("");
    const { data: inserted } = await supabase.from("messages").insert({
      content,
      sender_id: user.id,
      profile_receiver_id: selectedProfile.id,
      receiver_id: null,
      profile_sender_id: null,
    }).select().single();

    // Update conversation list locally instead of refetching
    if (inserted) {
      setConversations((prev) => {
        const others = prev.filter((c) => c.profile.id !== selectedProfile.id);
        const existing = prev.find((c) => c.profile.id === selectedProfile.id);
        return [
          {
            profile: existing?.profile ?? selectedProfile,
            lastMessage: inserted as Message,
            unread: existing?.unread ?? 0,
          },
          ...others,
        ];
      });
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />
      <div className="pt-20 px-4 md:px-6 max-w-4xl mx-auto pb-6">
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
                    onClick={() => selectProfile(conv.profile)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/40 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                      {conv.profile.photo_url ? (
                        <img src={conv.profile.photo_url} alt={conv.profile.name} className="w-full h-full object-cover" loading="lazy" />
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
            <div className="flex items-center gap-3 mb-4">
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

            <div className="bg-card border border-border/50 rounded-2xl p-4 mb-4 h-[50vh] md:h-[400px] overflow-y-auto space-y-3">
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
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Votre message..."
                className="flex-1 px-4 py-3 rounded-full bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim()} className="rounded-full bg-primary text-primary-foreground px-6">
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
