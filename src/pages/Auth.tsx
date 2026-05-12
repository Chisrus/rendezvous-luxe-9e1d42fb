import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Diamond, ArrowRight, ArrowLeft, Check, User as UserIcon, UserRound, Users, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "signup" | "forgot";
type Gender = "homme" | "femme" | "non-binaire";
type Orientation = "hetero" | "homo" | "bi" | "pan" | "trans" | "autre";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState(1); // 1: identity, 2: gender, 3: orientation, 4: account
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [orientation, setOrientation] = useState<Orientation | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) navigate("/profiles", { replace: true });
  }, [user, authLoading, navigate]);

  const resetSignup = () => {
    setStep(1);
    setName(""); setGender(""); setOrientation("");
    setEmail(""); setPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Bienvenue !", description: "Connexion réussie." });
      navigate("/profiles");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Email envoyé", description: "Vérifiez votre boîte mail." });
      setMode("login");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { name } },
      });
      if (error) throw error;
      // Mettre à jour le profil créé automatiquement avec gender/orientation/name
      if (data.user) {
        await supabase.from("profiles").update({
          name: name.trim(),
          gender,
          orientation,
        }).eq("created_by", data.user.id);
      }
      toast({ title: "Bienvenue dans le Cercle ✨", description: "Vérifiez votre email pour confirmer votre compte." });
      resetSignup();
      setMode("login");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;
  }

  // ----- LOGIN -----
  if (mode === "login") {
    return (
      <Shell title="Connexion">
        <form onSubmit={handleLogin} className="space-y-5">
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="votre@email.com" className="bg-background border-border/50" /></Field>
          <Field label="Mot de passe"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" className="bg-background border-border/50" /></Field>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/85 rounded-full font-semibold">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => setMode("forgot")} className="text-primary hover:underline">Mot de passe oublié ?</button>
            <button type="button" onClick={() => { setMode("signup"); setStep(1); }} className="text-primary hover:underline font-medium">Créer un compte →</button>
          </div>
        </form>
      </Shell>
    );
  }

  // ----- FORGOT -----
  if (mode === "forgot") {
    return (
      <Shell title="Mot de passe oublié">
        <form onSubmit={handleForgot} className="space-y-5">
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="votre@email.com" className="bg-background border-border/50" /></Field>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/85 rounded-full font-semibold">
            {loading ? "Envoi..." : "Envoyer le lien"}
          </Button>
          <p className="text-center text-sm">
            <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline">Retour</button>
          </p>
        </form>
      </Shell>
    );
  }

  // ----- SIGNUP MULTI-STEP -----
  const totalSteps = 4;
  return (
    <Shell title={`Étape ${step} / ${totalSteps}`}>
      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>

      {step === 1 && (
        <Step
          title="Comment vous appelez-vous ?"
          subtitle="C'est ce que les autres membres verront."
          onNext={() => name.trim().length >= 2 && setStep(2)}
          canNext={name.trim().length >= 2}
        >
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom" className="bg-background border-border/50 text-lg py-6 text-center" />
          <ValidationHint
            ok={name.trim().length >= 2}
            empty={name.length === 0}
            okMsg="Parfait"
            errorMsg="Au moins 2 caractères"
            hint="Votre prénom (visible des autres membres)"
          />
        </Step>
      )}

      {step === 2 && (
        <Step
          title="Vous êtes…"
          subtitle="Sélectionnez ce qui vous décrit le mieux."
          onBack={() => setStep(1)}
          onNext={() => gender && setStep(3)}
          canNext={!!gender}
        >
          <div className="grid grid-cols-1 gap-3">
            <ChoiceCard icon={<UserIcon className="w-6 h-6" />} label="Homme" selected={gender === "homme"} onClick={() => setGender("homme")} />
            <ChoiceCard icon={<UserRound className="w-6 h-6" />} label="Femme" selected={gender === "femme"} onClick={() => setGender("femme")} />
            <ChoiceCard icon={<Users className="w-6 h-6" />} label="Non-binaire / Autre" selected={gender === "non-binaire"} onClick={() => setGender("non-binaire")} />
          </div>
          <ValidationHint ok={!!gender} empty={!gender} okMsg="Sélection enregistrée" hint="Choisissez une option pour continuer" />
        </Step>
      )}

      {step === 3 && (
        <Step
          title="Votre orientation"
          subtitle="Pour vous proposer les profils les plus pertinents."
          onBack={() => setStep(2)}
          onNext={() => orientation && setStep(4)}
          canNext={!!orientation}
        >
          <div className="grid grid-cols-2 gap-3">
            <ChoiceCard label="Hétéro" selected={orientation === "hetero"} onClick={() => setOrientation("hetero")} />
            <ChoiceCard label="Homo" selected={orientation === "homo"} onClick={() => setOrientation("homo")} />
            <ChoiceCard label="Bi" selected={orientation === "bi"} onClick={() => setOrientation("bi")} />
            <ChoiceCard label="Pansexuel" selected={orientation === "pan"} onClick={() => setOrientation("pan")} />
            <ChoiceCard label="Trans" selected={orientation === "trans"} onClick={() => setOrientation("trans")} />
            <ChoiceCard label="Autre" selected={orientation === "autre"} onClick={() => setOrientation("autre")} />
          </div>
          <ValidationHint ok={!!orientation} empty={!orientation} okMsg="Sélection enregistrée" hint="Choisissez une option pour continuer" />
        </Step>
      )}

      {step === 4 && (
        <Step
          title="Créez votre accès"
          subtitle="Dernière étape — votre compte est presque prêt."
          onBack={() => setStep(3)}
          nextLabel={loading ? "Création..." : "Rejoindre le Cercle"}
          onNext={() => email && password.length >= 6 && handleSignup()}
          canNext={!loading && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6}
        >
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className={`bg-background ${email.length === 0 ? "border-border/50" : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "border-primary/60" : "border-destructive/60"}`}
            />
            <ValidationHint
              ok={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
              empty={email.length === 0}
              okMsg="Email valide"
              errorMsg="Format email invalide"
              hint="ex. nom@domaine.com"
            />
          </Field>
          <Field label="Mot de passe">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 caractères minimum"
              minLength={6}
              className={`bg-background ${password.length === 0 ? "border-border/50" : password.length >= 6 ? "border-primary/60" : "border-destructive/60"}`}
            />
            <PasswordStrength value={password} />
          </Field>
          <p className="text-xs text-muted-foreground text-center pt-2">
            En vous inscrivant, vous acceptez nos <a href="/terms" className="text-primary hover:underline">conditions</a>.
          </p>
        </Step>
      )}

      <p className="text-center text-sm text-muted-foreground mt-6">
        Déjà membre ?{" "}
        <button type="button" onClick={() => { setMode("login"); resetSignup(); }} className="text-primary hover:underline">
          Se connecter
        </button>
      </p>
    </Shell>
  );
};

const Shell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <a href="/" className="inline-block">
          <span className="text-2xl font-semibold tracking-wide">
            <span className="text-primary font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Rencontre</span>
            <span className="text-foreground font-light">DeLuxe</span>
          </span>
        </a>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Diamond className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary tracking-widest uppercase">{title}</span>
        </div>
      </div>
      <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-xl shadow-primary/5">{children}</div>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-foreground">{label}</Label>
    {children}
  </div>
);

const Step = ({
  title, subtitle, children, onBack, onNext, canNext, nextLabel,
}: {
  title: string; subtitle: string; children: React.ReactNode;
  onBack?: () => void; onNext: () => void; canNext: boolean; nextLabel?: string;
}) => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <h2 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    <div className="space-y-4">{children}</div>
    <div className="flex gap-3 pt-2">
      {onBack && (
        <Button type="button" variant="outline" onClick={onBack} className="rounded-full">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      )}
      <Button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/85 rounded-full font-semibold"
      >
        {nextLabel || "Continuer"} <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  </div>
);

const ChoiceCard = ({
  icon, label, selected, onClick,
}: {
  icon?: React.ReactNode; label: string; selected: boolean; onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex items-center justify-between gap-3 px-5 py-4 rounded-xl border-2 transition-all text-left ${
      selected
        ? "border-primary bg-primary/10 text-foreground"
        : "border-border/50 bg-background hover:border-primary/40 text-foreground"
    }`}
  >
    <span className="flex items-center gap-3 font-medium">
      {icon && <span className={selected ? "text-primary" : "text-muted-foreground"}>{icon}</span>}
      {label}
    </span>
    {selected && <Check className="w-5 h-5 text-primary" />}
  </button>
);

export default Auth;
