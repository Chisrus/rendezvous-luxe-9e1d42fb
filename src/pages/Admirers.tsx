import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import UserNavbar from "@/components/UserNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Heart, Lock, MapPin, MessageCircle, BadgeCheck, Sparkles } from "lucide-react";

interface Admirer {
  profile_id: string;
  name: string;
  age: number | null;
  city: string | null;
  photo_url: string | null;
  is_vip: boolean | null;
  is_verified: boolean | null;
  liked_at: string;
}

const Admirers = () => {
  const { user, loading } = useAuth();
  const { isAtLeast, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [admirers, setAdmirers] = useState<Admirer[]>([]);
  const [fetching, setFetching] = useState(true);

  const canSee = isAtLeast("premium");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Get profiles owned by user
      const { data: myProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("created_by", user.id);
      const ids = (myProfiles ?? []).map((p) => p.id);
      if (ids.length === 0) {
        setAdmirers([]);
        setFetching(false);
        return;
      }
      const { data: likes } = await supabase
        .from("likes")
        .select("liker_user_id, created_at")
        .in("liked_profile_id", ids)
        .order("created_at", { ascending: false });

      if (!likes || likes.length === 0) {
        setAdmirers([]);
        setFetching(false);
        return;
      }

      // Get one profile per liker user
      const likerIds = Array.from(new Set(likes.map((l: any) => l.liker_user_id)));
      const { data: likerProfiles } = await supabase
        .from("profiles")
        .select("id, name, age, city, photo_url, is_vip, is_verified, created_by")
        .in("created_by", likerIds);

      const byUser = new Map<string, any>();
      (likerProfiles ?? []).forEach((p: any) => {
        if (!byUser.has(p.created_by)) byUser.set(p.created_by, p);
      });

      const seen = new Set<string>();
      const list: Admirer[] = [];
      for (const l of likes as any[]) {
        if (seen.has(l.liker_user_id)) continue;
        seen.add(l.liker_user_id);
        const p = byUser.get(l.liker_user_id);
        if (!p) continue;
        list.push({
          profile_id: p.id,
          name: p.name,
          age: p.age,
          city: p.city,
          photo_url: p.photo_url,
          is_vip: p.is_vip,
          is_verified: p.is_verified,
          liked_at: l.created_at,
        });
      }
      setAdmirers(list);
      setFetching(false);
    })();
  }, [user]);

  if (loading || subLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />
      <div className="pt-20 px-4 md:px-6 max-w-6xl mx-auto pb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          <Heart className="w-7 h-7 text-primary" />
          Qui vous a <span className="text-primary">liké·e</span>
        </h1>
        <p className="text-muted-foreground mb-8">
          {admirers.length > 0
            ? `${admirers.length} personne${admirers.length > 1 ? "s ont" : " a"} aimé votre profil.`
            : "Personne ne vous a encore liké·e — soyez patient·e."}
        </p>

        {!canSee && admirers.length > 0 && (
          <div className="mb-8 p-5 rounded-2xl bg-primary/10 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Sparkles className="w-8 h-8 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-foreground font-semibold">Découvrez qui vous a liké·e</p>
              <p className="text-sm text-muted-foreground">Passez Premium pour voir leurs profils en clair et démarrer la conversation.</p>
            </div>
            <Button onClick={() => navigate("/#pricing")} className="rounded-full bg-primary text-primary-foreground">
              <Crown className="w-4 h-4 mr-2" /> Débloquer
            </Button>
          </div>
        )}

        {fetching ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : admirers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 text-primary/30" />
            <p>Pas encore d'admirateurs.</p>
            <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate("/profiles")}>
              Découvrir des profils
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {admirers.map((a) => (
              <div key={a.profile_id} className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/40 transition-all">
                <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
                  {a.photo_url ? (
                    <img
                      src={a.photo_url}
                      alt={canSee ? a.name : "Profil verrouillé"}
                      className={`w-full h-full object-cover ${canSee ? "" : "blur-2xl scale-110"}`}
                      loading="lazy"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-muted-foreground text-6xl font-light ${canSee ? "" : "blur-md"}`}>
                      {a.name[0]}
                    </div>
                  )}
                  {!canSee && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 z-10">
                      <div className="w-14 h-14 rounded-full bg-background/70 backdrop-blur-sm border border-primary/40 flex items-center justify-center mb-2">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-xs uppercase tracking-widest text-foreground/80 font-medium">Premium requis</span>
                    </div>
                  )}
                  {a.is_vip && (
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground z-20">
                      <Crown className="w-3 h-3 mr-1" /> VIP
                    </Badge>
                  )}
                </div>
                <div className="p-5">
                  <h3 className={`text-lg font-semibold text-foreground flex items-center gap-1.5 ${canSee ? "" : "blur-sm select-none"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    {a.name}{a.age ? `, ${a.age} ans` : ""}
                    {a.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                  </h3>
                  {a.city && (
                    <p className={`text-sm text-muted-foreground flex items-center gap-1 mt-1 ${canSee ? "" : "blur-[3px] select-none"}`}>
                      <MapPin className="w-3 h-3" /> {a.city}
                    </p>
                  )}
                  <div className="mt-4">
                    {canSee ? (
                      <Button size="sm" className="w-full rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                        onClick={() => navigate(`/inbox?profileId=${a.profile_id}&profileName=${encodeURIComponent(a.name)}&profilePhoto=${encodeURIComponent(a.photo_url || "")}`)}>
                        <MessageCircle className="w-4 h-4 mr-1" /> Envoyer un message
                      </Button>
                    ) : (
                      <Button size="sm" className="w-full rounded-full bg-primary text-primary-foreground"
                        onClick={() => navigate("/#pricing")}>
                        <Crown className="w-4 h-4 mr-1" /> Débloquer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admirers;