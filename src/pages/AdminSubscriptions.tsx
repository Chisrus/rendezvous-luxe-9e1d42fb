import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Crown, Search, X } from "lucide-react";

type Plan = "discovery" | "premium" | "vip";

interface Sub {
  id: string;
  user_id: string;
  plan: Plan;
  status: string;
  current_period_end: string | null;
}

interface ProfileMini {
  created_by: string | null;
  name: string;
}

const AdminSubscriptions = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileMini[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [plan, setPlan] = useState<Plan>("premium");
  const [days, setDays] = useState<number>(30);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
    if (!loading && user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin, loading, navigate]);

  const refresh = async () => {
    const { data: s } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });
    setSubs((s as Sub[]) ?? []);
    const ids = Array.from(new Set((s ?? []).map((x: any) => x.user_id)));
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("created_by, name")
        .in("created_by", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => { if (p.created_by) map[p.created_by] = p.name; });
      setNames(map);
    }
  };

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  const doSearch = async () => {
    if (!search.trim()) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("created_by, name")
      .ilike("name", `%${search.trim()}%`)
      .not("created_by", "is", null)
      .limit(10);
    setSearchResults((data as ProfileMini[]) ?? []);
  };

  const grant = async () => {
    if (!selectedUserId) return;
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + days);

    // Cancel any existing active subscription for that user
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", selectedUserId)
      .eq("status", "active");

    const { error } = await supabase.from("subscriptions").insert({
      user_id: selectedUserId,
      plan,
      status: "active",
      current_period_end: periodEnd.toISOString(),
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Abonnement activé", description: `${selectedName} est maintenant ${plan} pendant ${days} jours.` });
    setSelectedUserId(null);
    setSelectedName("");
    setSearch("");
    setSearchResults([]);
    refresh();
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Abonnement annulé" });
    refresh();
  };

  if (loading || !isAdmin) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          <Crown className="w-6 h-6 text-primary" /> Abonnements
        </h1>

        <div className="bg-card border border-border/50 rounded-2xl p-5 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Activer un abonnement</h2>

          {!selectedUserId ? (
            <>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Chercher un membre par nom de profil…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch()}
                />
                <Button onClick={doSearch} variant="outline" className="rounded-full">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {searchResults.map((r) => (
                    <button
                      key={r.created_by!}
                      onClick={() => { setSelectedUserId(r.created_by!); setSelectedName(r.name); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary text-sm text-foreground"
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Membre :</span>
                <span className="font-medium text-foreground">{selectedName}</span>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedUserId(null); setSelectedName(""); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Plan</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as Plan)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground"
                  >
                    <option value="discovery">Découverte</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Durée (jours)</label>
                  <Input
                    type="number"
                    min={1}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  />
                </div>
              </div>
              <Button onClick={grant} className="w-full rounded-full bg-primary text-primary-foreground">
                <Crown className="w-4 h-4 mr-2" /> Activer
              </Button>
            </div>
          )}
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Abonnements existants</h2>
          {subs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun abonnement.</p>
          ) : (
            <div className="space-y-2">
              {subs.map((s) => {
                const expired = s.current_period_end && new Date(s.current_period_end) < new Date();
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{names[s.user_id] ?? s.user_id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.current_period_end ? `jusqu'au ${new Date(s.current_period_end).toLocaleDateString("fr-FR")}` : "sans expiration"}
                      </p>
                    </div>
                    <Badge className="capitalize" variant={s.plan === "vip" ? "default" : "secondary"}>{s.plan}</Badge>
                    <Badge variant={s.status === "active" && !expired ? "default" : "outline"} className="capitalize">
                      {expired ? "expiré" : s.status}
                    </Badge>
                    {s.status === "active" && (
                      <Button size="sm" variant="ghost" onClick={() => cancel(s.id)} className="text-muted-foreground">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;