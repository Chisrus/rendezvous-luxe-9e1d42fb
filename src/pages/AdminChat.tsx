import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  name: string;
  created_by: string;
}

interface Message {
  id: string;
  content: string;
  profile_sender_id: string | null;
  profile_receiver_id: string | null;
  sender_id: string | null;
  receiver_id: string | null;
  created_at: string;
}

const AdminChat = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [mockProfiles, setMockProfiles] = useState<Profile[]>([]);
  const [realUsers, setRealUsers] = useState<Profile[]>([]);
  
  const [selectedMockProfile, setSelectedMockProfile] = useState<string>("");
  const [selectedTargetUser, setSelectedTargetUser] = useState<string>("");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from("profiles").select("id, name, created_by").order("name");
      if (data) {
        // Mock profiles: id is different from created_by
        setMockProfiles(data.filter(p => p.id !== p.created_by));
        // Real users: created by trigger where id = created_by, or just everyone else
        setRealUsers(data.filter(p => p.id === p.created_by));
      }
    };
    if (isAdmin) fetchProfiles();
  }, [isAdmin]);

  const fetchMessages = async () => {
    if (!selectedMockProfile || !selectedTargetUser) return;
    
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(profile_sender_id.eq.${selectedMockProfile},profile_receiver_id.eq.${selectedTargetUser}),and(profile_sender_id.eq.${selectedTargetUser},profile_receiver_id.eq.${selectedMockProfile}),and(sender_id.eq.${selectedTargetUser},profile_receiver_id.eq.${selectedMockProfile}),and(profile_sender_id.eq.${selectedMockProfile},receiver_id.eq.${selectedTargetUser})`)
      .order("created_at", { ascending: true });
      
    if (error) {
      console.error(error);
      toast({ title: "Erreur", description: "Impossible de charger les messages.", variant: "destructive" });
    } else {
      setMessages(data || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedMockProfile, selectedTargetUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMockProfile || !selectedTargetUser) return;

    try {
      const { error } = await supabase.from("messages").insert({
        content: newMessage.trim(),
        profile_sender_id: selectedMockProfile,
        profile_receiver_id: selectedTargetUser,
        sender_id: user!.id,
        receiver_id: selectedTargetUser,
      } as any);

      if (error) throw error;
      setNewMessage("");
      fetchMessages();
    } catch (error: any) {
      console.error(error);
      toast({ title: "Erreur d'envoi", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50 p-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour Admin
        </Button>
        <span className="text-xl font-semibold text-foreground flex-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          Messagerie d'Usurpation (Admin)
        </span>
      </nav>

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-4 h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card p-4 rounded-xl border border-border/50 shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">👤 Vous jouez le rôle de (Profil Faux) :</label>
            <Select value={selectedMockProfile} onValueChange={setSelectedMockProfile}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Sélectionnez un profil créé" />
              </SelectTrigger>
              <SelectContent>
                {mockProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">🎯 Vous envoyez un message à (Vrai Utilisateur) :</label>
            <Select value={selectedTargetUser} onValueChange={setSelectedTargetUser}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Sélectionnez l'utilisateur cible" />
              </SelectTrigger>
              <SelectContent>
                {realUsers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                {/* Fallback to messaging other mock profiles if there are no real users yet */}
                {realUsers.length === 0 && mockProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (Faux Profil aussi)</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 bg-card rounded-xl border border-border/50 overflow-hidden flex flex-col shadow-sm">
          {!selectedMockProfile || !selectedTargetUser ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Veuillez sélectionner un émetteur et un destinataire pour commencer.
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground mt-10">Aucun message échangé.</div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.profile_sender_id === selectedMockProfile || msg.sender_id === selectedMockProfile;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl p-3 ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary text-secondary-foreground rounded-tl-sm'}`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-3 bg-background border-t border-border/50 flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Tapez votre message ici..."
                  className="flex-1 rounded-full bg-secondary/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button type="submit" disabled={!newMessage.trim()} className="rounded-full w-10 h-10 p-0 shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
