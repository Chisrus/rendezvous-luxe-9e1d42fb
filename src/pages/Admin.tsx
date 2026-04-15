import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Users, MessageSquare, Bell, Search } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

interface Stats {
  totalProfiles: number;
  realUsers: number;
  fakeProfiles: number;
  totalMessages: number;
  totalNotifications: number;
}

const emptyForm = { name: "", age: "", city: "", bio: "", gender: "", interests: "", is_vip: false, is_verified: true, photo: null as File | null };

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<Stats>({ totalProfiles: 0, realUsers: 0, fakeProfiles: 0, totalMessages: 0, totalNotifications: 0 });

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
    if (!loading && user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin, loading, navigate]);

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setProfiles(data);
  };

  const fetchStats = async () => {
    const [profilesRes, messagesRes, notifsRes] = await Promise.all([
      supabase.from("profiles").select("id, created_by"),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase.from("notifications").select("id", { count: "exact", head: true }),
    ]);

    const allProfiles = profilesRes.data || [];
    const realUsers = allProfiles.filter(p => p.id === p.created_by).length;

    setStats({
      totalProfiles: allProfiles.length,
      realUsers,
      fakeProfiles: allProfiles.length - realUsers,
      totalMessages: messagesRes.count || 0,
      totalNotifications: notifsRes.count || 0,
    });
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchProfiles();
      fetchStats();
    }
  }, [user, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);

    try {
      let photoUrl: string | null = null;

      if (form.photo) {
        const ext = form.photo.name.split(".").pop();
        const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const path = `${uuid}.${ext}`;

        const { error: uploadErr } = await supabase.storage.from("profile-photos").upload(path, form.photo);
        if (uploadErr) throw new Error(`Erreur photo: ${uploadErr.message}`);
        const { data: urlData } = supabase.storage.from("profile-photos").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      const parsedAge = parseInt(form.age);
      const profileData = {
        name: form.name.trim(),
        age: !isNaN(parsedAge) ? parsedAge : null,
        city: form.city || null,
        bio: form.bio || null,
        gender: form.gender || null,
        interests: form.interests ? form.interests.split(",").map((s) => s.trim()).filter(Boolean) : null,
        is_vip: form.is_vip,
        is_verified: form.is_verified,
        ...(photoUrl && { photo_url: photoUrl }),
        ...(!editingId && { created_by: user?.id }),
      };

      if (editingId) {
        const { error } = await supabase.from("profiles").update(profileData).eq("id", editingId);
        if (error) throw new Error(error.message);
        toast({ title: "Succès", description: "Profil modifié." });
      } else {
        const { error } = await supabase.from("profiles").insert(profileData);
        if (error) throw new Error(error.message);
        toast({ title: "Succès", description: "Profil créé." });
      }

      setForm(emptyForm);
      setEditingId(null);
      setDialogOpen(false);
      fetchProfiles();
      fetchStats();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (p: Profile) => {
    setForm({
      name: p.name,
      age: p.age?.toString() || "",
      city: p.city || "",
      bio: p.bio || "",
      gender: p.gender || "",
      interests: p.interests?.join(", ") || "",
      is_vip: p.is_vip || false,
      is_verified: p.is_verified || false,
      photo: null,
    });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profil supprimé" });
      fetchProfiles();
      fetchStats();
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading || !user || !isAdmin) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;

  return (
    <AdminLayout>
      <div className="px-4 md:px-6 max-w-6xl mx-auto pt-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Profils", value: stats.totalProfiles, icon: Users, color: "text-primary" },
            { label: "Vrais users", value: stats.realUsers, icon: Users, color: "text-green-400" },
            { label: "Faux profils", value: stats.fakeProfiles, icon: Users, color: "text-muted-foreground" },
            { label: "Messages", value: stats.totalMessages, icon: MessageSquare, color: "text-blue-400" },
            { label: "Notifs", value: stats.totalNotifications, icon: Bell, color: "text-yellow-400" },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border/50 rounded-xl p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Header with search */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un profil..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border/50 rounded-full"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setForm(emptyForm); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/85 rounded-full px-6">
                <Plus className="w-4 h-4 mr-1" /> Nouveau profil
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {editingId ? "Modifier le profil" : "Créer un profil"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Nom *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-background border-border/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Âge</Label>
                    <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="bg-background border-border/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Ville</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-background border-border/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Genre</Label>
                    <Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="Homme, Femme..." className="bg-background border-border/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Bio</Label>
                  <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="bg-background border-border/50" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Centres d'intérêt (séparés par des virgules)</Label>
                  <Input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="Voyages, Gastronomie, Art..." className="bg-background border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Photo</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })} className="bg-background border-border/50" />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.is_vip} onCheckedChange={(v) => setForm({ ...form, is_vip: v })} />
                  <Label className="text-foreground">Membre VIP</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.is_verified} onCheckedChange={(v) => setForm({ ...form, is_verified: v })} />
                  <Label className="text-foreground">Profil Vérifié ✓</Label>
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/85 rounded-full font-semibold">
                  {submitting ? "Enregistrement..." : editingId ? "Modifier" : "Créer le profil"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profile list */}
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>{searchQuery ? "Aucun résultat." : "Aucun profil créé."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProfiles.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 bg-card border border-border/50 rounded-xl hover:border-primary/30 transition-colors">
                <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg">{p.name[0]}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{p.name}</span>
                    {p.age && <span className="text-muted-foreground text-sm">{p.age} ans</span>}
                    {p.city && <span className="text-muted-foreground text-sm">• {p.city}</span>}
                    {p.is_vip && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">VIP</span>}
                    {p.id === p.created_by && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Vrai user</span>}
                  </div>
                  {p.bio && <p className="text-sm text-muted-foreground truncate">{p.bio}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(p)} className="text-muted-foreground hover:text-primary">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border/50">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Supprimer ce profil ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Le profil de <strong>{p.name}</strong> sera définitivement supprimé.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive text-destructive-foreground rounded-full">
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Admin;
