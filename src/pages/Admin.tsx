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
import { Plus, Trash2, ArrowLeft, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
    if (!loading && user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin, loading, navigate]);

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setProfiles(data);
  };

  useEffect(() => { if (user && isAdmin) fetchProfiles(); }, [user, isAdmin]);

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
        if (uploadErr) {
          console.error("Storage upload error:", uploadErr);
          throw new Error(`Erreur lors du téléchargement de la photo: ${uploadErr.message}`);
        }
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
        if (error) {
          console.error("Update profile error:", error);
          throw new Error(`Erreur lors de la modification: ${error.message}`);
        }
        toast({ title: "Succès", description: "Profil modifié avec succès." });
      } else {
        const { error } = await supabase.from("profiles").insert(profileData);
        if (error) {
          console.error("Insert profile error:", error);
          throw new Error(`Erreur lors de la création: ${error.message}`);
        }
        toast({ title: "Succès", description: "Profil créé avec succès." });
      }

      setForm(emptyForm);
      setEditingId(null);
      setDialogOpen(false);
      fetchProfiles();
    } catch (error: any) {
      console.error("HandleSubmit Error:", error);
      toast({ title: "Erreur", description: error.message || "Impossible d'enregistrer le profil.", variant: "destructive" });
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
    }
  };

  if (loading || !user || !isAdmin) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/profiles")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour
            </Button>
            <span className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Administration
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/admin-chat")} className="border-primary/30 text-primary hover:bg-primary/10 rounded-full px-6">
              Messagerie Admin
            </Button>
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
          </div>
        </nav>

      <div className="pt-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold text-foreground mb-6">{profiles.length} profil(s)</h2>

        {profiles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Aucun profil créé. Cliquez sur "Nouveau profil" pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 bg-card border border-border/50 rounded-xl hover:border-primary/30 transition-colors">
                <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg">{p.name[0]}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{p.name}</span>
                    {p.age && <span className="text-muted-foreground text-sm">{p.age} ans</span>}
                    {p.city && <span className="text-muted-foreground text-sm">• {p.city}</span>}
                    {p.is_vip && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">VIP</span>}
                  </div>
                  {p.bio && <p className="text-sm text-muted-foreground truncate">{p.bio}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(p)} className="text-muted-foreground hover:text-primary">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
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

export default Admin;
