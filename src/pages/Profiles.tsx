import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, MapPin, Heart, MessageCircle, BadgeCheck, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "@/components/UserNavbar";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import PaywallModal from "@/components/PaywallModal";

const FREE_DAILY_LIKES = 5;

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
  is_verified: boolean | null;
  created_by: string | null;
}

const PAGE_SIZE = 12;

const FIRST_NAMES_F = ["Aïcha", "Sophie", "Mariam", "Léa", "Fatou", "Camille", "Inès", "Awa", "Chloé", "Naomi", "Sara", "Élodie", "Yasmine", "Clara", "Aminata", "Julie", "Maya", "Anna", "Khadija", "Nadia"];
const FIRST_NAMES_M = ["Karim", "Lucas", "Yannick", "Hugo", "Ibrahim", "Samuel", "Mehdi", "Antoine", "Adama", "Théo", "Arthur", "Malick", "Nathan", "Cédric", "Ousmane"];
const CITIES = ["Abidjan", "Dakar", "Paris", "Cotonou", "Lomé", "Bamako", "Marseille", "Lyon", "Bruxelles", "Genève", "Yaoundé", "Casablanca"];

interface LockedProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  is_vip: boolean;
}

const LOCKED_TOTAL = 48;
const seededRandom = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};
const buildLockedProfiles = (): LockedProfile[] => {
  return Array.from({ length: LOCKED_TOTAL }, (_, i) => {
    const r = seededRandom(i + 1);
    const isF = r > 0.4;
    const pool = isF ? FIRST_NAMES_F : FIRST_NAMES_M;
    return {
      id: `locked-${i}`,
      name: pool[Math.floor(seededRandom(i + 7) * pool.length)],
      age: 22 + Math.floor(seededRandom(i + 13) * 22),
      city: CITIES[Math.floor(seededRandom(i + 21) * CITIES.length)],
      is_vip: seededRandom(i + 33) > 0.7,
    };
  });
};
const LOCKED_PROFILES = buildLockedProfiles();
const TOTAL_DISPLAY = "12 482";

const Profiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likesToday, setLikesToday] = useState(0);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const { user, loading } = useAuth();
  const { isFree } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfiles(0);
      loadLikes();
    }
  }, [user]);

  const loadLikes = async () => {
    if (!user) return;
    const { data } = await supabase.from("likes").select("liked_profile_id, created_at").eq("liker_user_id", user.id);
    if (data) setLikedIds(new Set(data.map((l: any) => l.liked_profile_id)));
    if (data) {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      setLikesToday(data.filter((l: any) => new Date(l.created_at) >= startOfDay).length);
    }
  };

  const toggleLike = async (profileId: string) => {
    if (!user) return;
    const isLiked = likedIds.has(profileId);
    if (isLiked) {
      await supabase.from("likes").delete().eq("liker_user_id", user.id).eq("liked_profile_id", profileId);
      setLikedIds(prev => { const n = new Set(prev); n.delete(profileId); return n; });
      setLikesToday((c) => Math.max(0, c - 1));
    } else {
      if (isFree && likesToday >= FREE_DAILY_LIKES) {
        setPaywallOpen(true);
        return;
      }
      const { error } = await supabase.from("likes").insert({ liker_user_id: user.id, liked_profile_id: profileId });
      if (!error) {
        setLikedIds(prev => new Set(prev).add(profileId));
        setLikesToday((c) => c + 1);
        toast({ title: "Like envoyé", description: "Si c'est mutuel, vous serez notifié·e ✨" });
      }
    }
  };

  const loadProfiles = async (p: number) => {
    const from = p * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data) {
      if (p === 0) {
        setProfiles(data);
      } else {
        setProfiles(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
      setPage(p);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />
      <div className="pt-20 px-4 md:px-6 max-w-6xl mx-auto pb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Nos <span className="text-primary">Membres</span>
        </h1>
        <p className="text-muted-foreground mb-4">Découvrez des profils d'exception.</p>

        {isFree && (
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/50 text-xs">
            <Heart className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">
              Likes du jour : <span className="text-foreground font-medium">{likesToday}/{FREE_DAILY_LIKES}</span>
            </span>
            <button onClick={() => navigate("/#pricing")} className="text-primary font-medium hover:underline">
              Illimité avec Premium
            </button>
          </div>
        )}

        <PaywallModal
          open={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          title="Limite de likes atteinte"
          description={`Vous avez utilisé vos ${FREE_DAILY_LIKES} likes gratuits du jour. Passez Premium pour des likes illimités.`}
        />

        {profiles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 text-primary/30" />
            <p>Aucun profil pour le moment.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles
                .filter(p => p.created_by !== user?.id) // Hide own profile from grid
                .map((p) => (
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
                    {p.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.bio}</p>}
                    {p.interests && p.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {p.interests.slice(0, 3).map((i, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{i}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="rounded-full px-3"
                        onClick={() => toggleLike(p.id)}
                        aria-label={likedIds.has(p.id) ? "Retirer le like" : "Liker ce profil"}>
                        <Heart className={`w-4 h-4 ${likedIds.has(p.id) ? "fill-primary text-primary" : ""}`} />
                      </Button>
                      <Button size="sm" className="flex-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                        onClick={() => navigate(`/inbox?profileId=${p.id}&profileName=${encodeURIComponent(p.name)}&profilePhoto=${encodeURIComponent(p.photo_url || "")}`)}>
                        <MessageCircle className="w-4 h-4 mr-1" /> Message
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-8">
                <Button variant="outline" className="rounded-full" onClick={() => loadProfiles(page + 1)}>
                  Voir plus de profils
                </Button>
              </div>
            )}

            {/* Locked teaser profiles */}
            <div className="mt-16">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    <Sparkles className="w-6 h-6 text-primary" />
                    Plus de <span className="text-primary">{TOTAL_DISPLAY}</span> profils exclusifs
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Débloquez l'accès complet en souscrivant à un abonnement.
                  </p>
                </div>
                <Button className="rounded-full bg-primary text-primary-foreground self-start"
                  onClick={() => navigate("/#pricing")}>
                  <Crown className="w-4 h-4 mr-2" /> Voir les abonnements
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {LOCKED_PROFILES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate("/#pricing")}
                    className="group relative bg-card border border-border/50 rounded-2xl overflow-hidden text-left hover:border-primary/40 transition-all"
                    aria-label="Profil verrouillé — abonnez-vous pour découvrir"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden">
                      {/* Blurred placeholder visual */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.35), transparent 60%), radial-gradient(circle at 70% 70%, hsl(var(--primary) / 0.25), transparent 65%), hsl(var(--secondary))`,
                          filter: "blur(18px)",
                          transform: "scale(1.15)",
                        }}
                      />
                      <div className="absolute inset-0 bg-background/40" />
                      {p.is_vip && (
                        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground z-10">
                          <Crown className="w-3 h-3 mr-1" /> VIP
                        </Badge>
                      )}
                      {/* Lock overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                        <div className="w-14 h-14 rounded-full bg-background/70 backdrop-blur-sm border border-primary/40 flex items-center justify-center">
                          <Lock className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xs uppercase tracking-widest text-foreground/80 font-medium">
                          Profil privé
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-foreground blur-sm select-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {p.name}, {p.age} ans
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 blur-[3px] select-none">
                        <MapPin className="w-3 h-3" /> {p.city}
                      </p>
                      <div className="mt-4 text-sm text-primary flex items-center gap-1 font-medium">
                        <Crown className="w-4 h-4" /> Souscrire pour découvrir
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center mt-10">
                <p className="text-muted-foreground text-sm mb-4">
                  Et bien d'autres encore... Accédez à la totalité de notre communauté privée.
                </p>
                <Button size="lg" className="rounded-full bg-primary text-primary-foreground"
                  onClick={() => navigate("/#pricing")}>
                  <Crown className="w-5 h-5 mr-2" /> Débloquer l'accès complet
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profiles;
