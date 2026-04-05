import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, MapPin, Heart, MessageCircle, LogOut, Shield, BadgeCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  name: string;
  age: number | null;
  city: string | null;
  bio: string | null;
  photo_url: string | null;
  gender: string | null;
  interests: string[] | null;
  is_vip: boolean | null;
}

const Profiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { user, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").order("created_at", { ascending: false })
        .then(({ data }) => { if (data) setProfiles(data); });
    }
  }, [user]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold tracking-wide">
            <span className="text-primary font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Rencontre</span>
            <span className="text-foreground font-light">DeLuxe</span>
          </a>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => navigate("/admin")} className="rounded-full border-primary/30 text-primary">
                <Shield className="w-4 h-4 mr-1" /> Admin
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={signOut} className="text-muted-foreground">
              <LogOut className="w-4 h-4 mr-1" /> Déconnexion
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 px-6 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Nos <span className="text-primary">Membres</span>
        </h1>
        <p className="text-muted-foreground mb-10">Découvrez des profils d'exception.</p>

        {profiles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 text-primary/30" />
            <p>Aucun profil pour le moment.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((p) => (
              <div key={p.id} className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/40 transition-all">
                <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-6xl font-light">
                      {p.name[0]}
                    </div>
                  )}
                  {p.is_vip && (
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                      <Crown className="w-3 h-3 mr-1" /> VIP
                    </Badge>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {p.name}{p.age ? `, ${p.age} ans` : ""}
                  </h3>
                  {p.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {p.city}
                    </p>
                  )}
                  {p.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.bio}</p>}
                  {p.interests && p.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {p.interests.slice(0, 3).map((i, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{i}</Badge>
                      ))}
                    </div>
                  )}
                  <Button size="sm" className="w-full mt-4 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
                    <MessageCircle className="w-4 h-4 mr-1" /> Envoyer un message
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profiles;
