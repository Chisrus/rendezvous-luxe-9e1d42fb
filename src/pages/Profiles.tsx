import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, MapPin, Heart, MessageCircle, BadgeCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "@/components/UserNavbar";
import { useToast } from "@/hooks/use-toast";

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

const Profiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const { user, loading } = useAuth();
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
    const { data } = await supabase.from("likes").select("liked_profile_id").eq("liker_user_id", user.id);
    if (data) setLikedIds(new Set(data.map((l: any) => l.liked_profile_id)));
  };

  const toggleLike = async (profileId: string) => {
    if (!user) return;
    const isLiked = likedIds.has(profileId);
    if (isLiked) {
      await supabase.from("likes").delete().eq("liker_user_id", user.id).eq("liked_profile_id", profileId);
      setLikedIds(prev => { const n = new Set(prev); n.delete(profileId); return n; });
    } else {
      const { error } = await supabase.from("likes").insert({ liker_user_id: user.id, liked_profile_id: profileId });
      if (!error) {
        setLikedIds(prev => new Set(prev).add(profileId));
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
        <p className="text-muted-foreground mb-10">Découvrez des profils d'exception.</p>

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
          </>
        )}
      </div>
    </div>
  );
};

export default Profiles;
