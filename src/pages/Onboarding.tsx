import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Camera, Diamond, Check, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const hasBackend = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const FRONTEND_ONLY_SIGNUP_FLOW = true;

const Onboarding = () => {
  const { user, loading, onboardingComplete, refreshOnboarding } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (FRONTEND_ONLY_SIGNUP_FLOW || !hasBackend) return;
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  // Redirection instantanée si le contexte sait déjà que c'est complet
  useEffect(() => {
    if (FRONTEND_ONLY_SIGNUP_FLOW || !hasBackend) return;
    if (onboardingComplete === true) navigate("/profiles", { replace: true });
  }, [onboardingComplete, navigate]);

  // Garde serveur autoritaire : vérifie via RPC si l'onboarding est déjà complet
  // (évite la boucle si le cache local est obsolète après un refresh).
  useEffect(() => {
    if (FRONTEND_ONLY_SIGNUP_FLOW || !hasBackend || !user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("is_onboarding_complete", { _user_id: user.id });
      if (cancelled || error) return;
      if (data === true) {
        await refreshOnboarding();
        navigate("/profiles", { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [user, navigate, refreshOnboarding]);

  // Pré-remplir si données partielles existantes
  useEffect(() => {
    if (FRONTEND_ONLY_SIGNUP_FLOW || !hasBackend || !user) return;
    supabase.from("profiles").select("bio, photo_url").eq("created_by", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.photo_url) setPhotoUrl(data.photo_url);
        if (data?.bio) setBio(data.bio);
      });
  }, [user]);

  const bioValid = bio.trim().length >= 20;
  const photoValid = !!photoFile || !!photoUrl;
  const completedSteps = (photoValid ? 1 : 0) + (bioValid ? 1 : 0);
  const progressPct = Math.round((completedSteps / 2) * 100);

  const handleFinish = async () => {
    if (FRONTEND_ONLY_SIGNUP_FLOW || !hasBackend) {
      setCompleted(true);
      toast({ title: "Profil enregistré", description: "Le tunnel public est actif pendant la refonte du backend." });
      setTimeout(() => navigate("/", { replace: true }), 1200);
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      let newUrl = photoUrl;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${user.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, photoFile);
        if (upErr) throw upErr;
        newUrl = supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
      }
      const profilePayload = {
        bio: bio.trim(),
        photo_url: newUrl,
      };

      const { data: existingProfiles, error: existingError } = await supabase
        .from("profiles")
        .select("id")
        .eq("created_by", user.id)
        .limit(1);

      if (existingError) throw existingError;

      const existingProfileId = existingProfiles?.[0]?.id;
      const { error } = existingProfileId
        ? await supabase.from("profiles").update(profilePayload).eq("id", existingProfileId)
        : await supabase.from("profiles").insert({
            id: user.id,
            created_by: user.id,
            name: user.user_metadata?.name?.trim() || user.email?.split("@")[0] || "Utilisateur",
            ...profilePayload,
          });

      if (error) throw error;
      await refreshOnboarding();
      setCompleted(true);
      toast({ title: "Bienvenue dans le Cercle ✨", description: "Votre profil est prêt." });
      setTimeout(() => navigate("/profiles", { replace: true }), 1600);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-card border border-primary/30 rounded-2xl p-10 text-center shadow-xl shadow-primary/10">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center mb-5">
            <Check className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Profil complété
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Votre photo et votre bio ont bien été enregistrées. Bienvenue dans le Cercle.
          </p>
          <Progress value={100} className="h-2" aria-label="Onboarding terminé à 100%" />
          <p className="text-xs text-primary mt-4 tracking-widest uppercase">Redirection en cours…</p>
        </div>
      </div>
    );
  }

  const totalSteps = 2;
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary tracking-widest uppercase">Finalisez votre profil</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Plus que <span className="text-primary">2 étapes</span> avant l'accès
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Un profil complet = 5× plus de matchs.</p>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-xl shadow-primary/5">
          <div className="mb-8 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground tracking-widest uppercase">
                Étape {step}/{totalSteps}
              </span>
              <span className="text-primary font-semibold">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" aria-label={`Progression de l'inscription : ${progressPct}%`} />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className={`inline-flex items-center gap-1 ${photoValid ? "text-primary" : ""}`}>
                {photoValid ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current" />}
                Photo
              </span>
              <span className={`inline-flex items-center gap-1 ${bioValid ? "text-primary" : ""}`}>
                {bioValid ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current" />}
                Bio
              </span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Votre photo de profil
                </h2>
                <p className="text-sm text-muted-foreground">Les profils avec photo reçoivent 9× plus de likes.</p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <label className="w-32 h-32 rounded-full bg-secondary overflow-hidden relative group cursor-pointer border-2 border-dashed border-border hover:border-primary/60 transition-colors flex items-center justify-center">
                  {photoFile || photoUrl ? (
                    <img
                      src={photoFile ? URL.createObjectURL(photoFile) : photoUrl!}
                      alt="Aperçu de votre photo de profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                  <input
                    id="onboarding-photo"
                    type="file"
                    accept="image/*"
                    aria-label="Choisir une photo de profil"
                    className="hidden"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  {photoValid ? <span className="text-primary inline-flex items-center gap-1"><Check className="w-3 h-3" /> Photo prête</span> : "Cliquez pour ajouter une photo"}
                </p>
              </div>

              <Button
                onClick={() => photoValid && setStep(2)}
                disabled={!photoValid}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/85 rounded-full font-semibold"
              >
                Continuer <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Présentez-vous en quelques mots
                </h2>
                <p className="text-sm text-muted-foreground">Soyez authentique — c'est ce qui attire les meilleurs profils.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="onboarding-bio" className="sr-only">Votre bio</label>
                <Textarea
                  id="onboarding-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Passionné(e) de voyages, de gastronomie et de longues conversations..."
                  rows={5}
                  className="bg-background border-border/50 resize-none"
                  maxLength={500}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={bioValid ? "text-primary inline-flex items-center gap-1" : "text-muted-foreground"}>
                    {bioValid ? <><Check className="w-3 h-3" /> Bio valide</> : `${Math.max(0, 20 - bio.trim().length)} caractères restants minimum`}
                  </span>
                  <span className="text-muted-foreground">{bio.length}/500</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-full" aria-label="Étape précédente">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={!bioValid || saving}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/85 rounded-full font-semibold"
                >
                  {saving ? "Enregistrement..." : "Accéder au Cercle"}
                  {!saving && <Diamond className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
