import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import UserNavbar from "@/components/UserNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, MapPin, BadgeCheck, Crown } from "lucide-react";

interface MatchProfile {
  id: string;
  name: string;
  age: number | null;
  city: string | null;
  photo_url: string | null;
  created_by: string | null;
  is_vip: boolean | null;
  is_verified: boolean | null;
}

const Matches = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) loadMatches();
  }, [user]);

  const loadMatches = async () => {
    if (!user) return;
    setBusy(true);

    // Profils que j'ai likés
    const { data: myLikes } = await supabase
      .from("likes")
      .select("liked_profile_id, profiles:liked_profile_id(id,name,age,city,photo_url,created_by,is_vip,is_verified)")
      .eq("liker_user_id", user.id);

    // Mes propres profils
    const { data: myProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("created_by", user.id);
    const myProfileIds = (myProfiles ?? []).map(p => p.id);

    // Personnes ayant liké un de mes profils
    let mutualUserIds = new Set<string>();
    if (myProfileIds.length > 0) {
      const { data: incoming } = await supabase
        .from("likes")
        .select("liker_user_id")
        .in("liked_profile_id", myProfileIds);
      (incoming ?? []).forEach((l: any) => mutualUserIds.add(l.liker_user_id));
    }

    const result: MatchProfile[] = [];
    const seen = new Set<string>();
    (myLikes ?? []).forEach((row: any) => {
      const p = row.profiles;
      if (p && p.created_by && mutualUserIds.has(p.created_by) && !seen.has(p.id)) {
        seen.add(p.id);
        result.push(p);
      }
    });

    setMatches(result);
    setBusy(false);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />
      <div className="pt-20 px-4 md:px-6 max-w-6xl mx-auto pb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Mes <span className="text-primary">Matchs</span>
        </h1>
        <p className="text-muted-foreground mb-10">Vos coups de cœur partagés.</p>

        {busy ? (
          <p className="text-muted-foreground text-center py-20">Chargement des matchs…</p>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 text-primary/30" />
            <p>Aucun match pour l'instant. Continuez à liker des profils ✨</p>
            <Button className="mt-6 rounded-full" onClick={() => navigate("/profiles")}>Découvrir les profils</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(p => (
              <div key={p.id} className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/40 transition-all">
                <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
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
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                    <Heart className="w-3 h-3 mr-1 fill-current" /> Match
                  </Badge>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-1.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {p.name}{p.age ? `, ${p.age} ans` : ""}
                    {p.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                  </h3>
                  {p.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {p.city}
                    </p>
                  )}
                  <Button size="sm" className="w-full mt-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => navigate(`/inbox?profileId=${p.id}&profileName=${encodeURIComponent(p.name)}&profilePhoto=${encodeURIComponent(p.photo_url || "")}`)}>
                    <MessageCircle className="w-4 h-4 mr-1" /> Démarrer la conversation
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

export default Matches;