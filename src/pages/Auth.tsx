import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Diamond, ArrowRight, ArrowLeft, Check, User as UserIcon, UserRound, Users, AlertCircle, Crown, Star, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "signup" | "forgot";
type Gender = "homme" | "femme" | "non-binaire";
type Orientation = "hetero" | "homo" | "bi" | "pan" | "trans" | "autre";
const hasBackend = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState(1);
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
    // Ne redirige que si on est en mode "login" ; en signup, on reste sur la page
    // pour permettre l'affichage de l'étape 5 (abonnement) après création du compte.
    if (!authLoading && user && mode === "login") navigate("/profiles", { replace: true });
  }, [user, authLoading, navigate, mode]);

  const resetSignup = () => {
    setStep(1);
    setName(""); setGender(""); setOrientation("");
    setEmail(""); setPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasBackend) {
      toast({ title: "Connexion indisponible", description: "Le tunnel de paiement reste disponible pendant la refonte du backend." });
      navigate("/auth", { replace: true });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Bienvenue !", description: "Connexion réussie." });
      navigate("/profiles");
    } catch (err: any) {
      console.error("Erreur connexion:", err);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasBackend) {
      toast({ title: "Email indisponible", description: "La réinitialisation sera remise en place après la refonte du backend." });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Email envoyé", description: "Vérifiez votre boîte mail." });
      setMode("login");
    } catch (err: any) {
      console.error("Erreur reset:", err);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    toast({ title: "Étape suivante", description: "Choisissez maintenant votre abonnement Wave." });
    setStep(5);
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;
  }

  if (mode === "login") {
    if (user) {
      return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Redirection...</div>;
    }
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

  const totalSteps = 5;
  return (
    <Shell title={`Étape ${step} / ${totalSteps}`}>
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
          nextLabel={loading ? "Création..." : "Continuer"}
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

      {step === 5 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-primary tracking-widest uppercase">Activation requise</span>
            </div>
            <h2 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Choisissez votre abonnement
            </h2>
            <p className="text-sm text-muted-foreground">
              Réglez via Wave. Votre accès est activé par notre équipe sous quelques minutes.
            </p>
          </div>

          <div className="space-y-3">
            <PlanRow
              icon={<Star className="w-5 h-5 text-primary" />}
              name="Découverte"
              price="3 000 F"
              link="https://pay.wave.com/m/M_ci_FQHZsKYkp65N/c/ci/?amount=3000"
            />
            <PlanRow
              icon={<Crown className="w-5 h-5 text-primary" />}
              name="Premium"
              price="5 000 F"
              link="https://pay.wave.com/m/M_ci_FQHZsKYkp65N/c/ci/?amount=5000"
              highlighted
              badge="Populaire"
            />
            <PlanRow
              icon={<Diamond className="w-5 h-5 text-primary" />}
              name="VIP"
              price="10 000 F"
              link="https://pay.wave.com/m/M_ci_FQHZsKYkp65N/c/ci/?amount=10000"
            />
          </div>

           <Button
             type="button"
             onClick={() => navigate("/subscribe", { replace: true, state: { fromSignup: true, signupDraft: { name: name.trim(), gender, orientation, email } } })}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/85 rounded-full font-semibold"
          >
            J'ai payé — continuer <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Après paiement, votre accès au Cercle sera activé manuellement par notre équipe.
          </p>
        </div>
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
      <h1 className="sr-only">Accès au cercle RencontreDeLuxe — {title}</h1>
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

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-foreground">{label}</Label>
      {Array.isArray(children) ? children : <FieldChild id={id}>{children}</FieldChild>}
    </div>
  );
};

const FieldChild = ({ id, children }: { id: string; children: React.ReactNode }) => {
  if (!children || typeof children !== "object" || !("props" in (children as any))) return <>{children}</>;
  const child = children as React.ReactElement;
  return React.cloneElement(child, { id: child.props.id || id });
};

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
        <Button type="button" variant="outline" onClick={onBack} className="rounded-full" aria-label="Étape précédente">
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

const ValidationHint = ({
  ok, empty, okMsg, errorMsg, hint,
}: { ok: boolean; empty: boolean; okMsg?: string; errorMsg?: string; hint?: string }) => {
  if (empty) {
    return hint ? <p className="text-xs text-muted-foreground mt-1.5">{hint}</p> : null;
  }
  if (ok) {
    return (
      <p className="text-xs text-primary mt-1.5 inline-flex items-center gap-1">
        <Check className="w-3 h-3" /> {okMsg ?? "Valide"}
      </p>
    );
  }
  return (
    <p className="text-xs text-destructive mt-1.5 inline-flex items-center gap-1">
      <AlertCircle className="w-3 h-3" /> {errorMsg ?? "Invalide"}
    </p>
  );
};

const PasswordStrength = ({ value }: { value: string }) => {
  const len = value.length;
  const hasNum = /\d/.test(value);
  const hasUp = /[A-Z]/.test(value);
  const score = (len >= 6 ? 1 : 0) + (len >= 10 ? 1 : 0) + (hasNum ? 1 : 0) + (hasUp ? 1 : 0);
  const labels = ["Trop court", "Faible", "Correct", "Bon", "Excellent"];
  const colors = ["bg-destructive", "bg-destructive", "bg-yellow-500", "bg-primary", "bg-primary"];
  if (len === 0) {
    return <p className="text-xs text-muted-foreground mt-1.5">6 caractères minimum</p>;
  }
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-border"}`} />
        ))}
      </div>
      <p className={`text-xs inline-flex items-center gap-1 ${len < 6 ? "text-destructive" : score >= 3 ? "text-primary" : "text-muted-foreground"}`}>
        {len >= 6 ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
        {labels[score]}
      </p>
    </div>
  );
};

const PlanRow = ({
  icon, name, price, link, highlighted, badge,
}: { icon: React.ReactNode; name: string; price: string; link: string; highlighted?: boolean; badge?: string }) => (
  <a
    href={link}
    target="_blank"
    rel="noopener noreferrer"
    className={`relative flex items-center justify-between gap-3 px-5 py-4 rounded-xl border-2 transition-all ${
      highlighted
        ? "border-primary bg-primary/10"
        : "border-border/50 bg-background hover:border-primary/40"
    }`}
  >
    {badge && (
      <span className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold tracking-wide">
        {badge}
      </span>
    )}
    <span className="flex items-center gap-3">
      {icon}
      <span className="font-medium text-foreground">{name}</span>
    </span>
    <span className="text-foreground font-semibold">{price}</span>
  </a>
);

export default Auth;
