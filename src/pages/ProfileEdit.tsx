import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save } from "lucide-react";
import UserNavbar from "@/components/UserNavbar";

const ProfileEdit = () => {
  const { user, loading, refreshOnboarding } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    city: "",
    bio: "",
    gender: "",
    interests: "",
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("created_by", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            name: data.name || "",
            age: data.age?.toString() || "",
            city: data.city || "",
            bio: data.bio || "",
            gender: data.gender || "",
            interests: data.interests?.join(", ") || "",
          });
          setPhotoUrl(data.photo_url);
        }
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.name.trim()) return;
    setSaving(true);

    try {
      let newPhotoUrl = photoUrl;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${user.id}-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("profile-photos").upload(path, photoFile);
        if (uploadErr) throw new Error(uploadErr.message);
        const { data: urlData } = supabase.storage.from("profile-photos").getPublicUrl(path);
        newPhotoUrl = urlData.publicUrl;
      }

      const parsedAge = parseInt(form.age);
      const { error } = await supabase
        .from("profiles")
        .update({
          name: form.name.trim(),
          age: !isNaN(parsedAge) ? parsedAge : null,
          city: form.city || null,
          bio: form.bio || null,
          gender: form.gender || null,
          interests: form.interests ? form.interests.split(",").map(s => s.trim()).filter(Boolean) : null,
          ...(newPhotoUrl && { photo_url: newPhotoUrl }),
        })
        .eq("created_by", user.id);

      if (error) throw error;
      await refreshOnboarding();
      toast({ title: "Profil mis à jour !" });
      setPhotoUrl(newPhotoUrl);
      setPhotoFile(null);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />
      <div className="pt-24 px-6 max-w-2xl mx-auto pb-12">
        <h1 className="text-3xl font-bold text-foreground mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
          Mon <span className="text-primary">Profil</span>
        </h1>

        <form onSubmit={handleSave} className="space-y-6 bg-card border border-border/50 rounded-2xl p-6 md:p-8">
          {/* Photo */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-28 rounded-full bg-secondary overflow-hidden relative group">
              {photoUrl || photoFile ? (
                <img
                  src={photoFile ? URL.createObjectURL(photoFile) : photoUrl!}
                  alt="Photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-light text-muted-foreground">
                  {form.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Cliquez pour changer la photo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Nom *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-background border-border/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Âge</Label>
              <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="bg-background border-border/50" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <Button type="submit" disabled={saving} className="w-full bg-primary text-primary-foreground hover:bg-primary/85 rounded-full font-semibold">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;
