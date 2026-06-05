import { Check, Crown, Star, Diamond, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const hasBackend = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const Subscribe = () => {
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const { plan, loading: subLoading, refresh } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasBackend) return;
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!hasBackend) return;
    if (!subLoading && (isAdmin || plan !== "free")) {
      navigate("/onboarding", { replace: true });
    }
  }, [subLoading, plan, isAdmin, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-wide">
            <span className="text-primary font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Rencontre</span>
            <span className="text-foreground font-light">DeLuxe</span>
          </span>
          <Button size="sm" variant="ghost" onClick={() => { signOut(); navigate("/"); }} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </nav>

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary tracking-widest uppercase">Activation requise</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Choisissez votre <span className="text-primary">abonnement</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            L'accès au Cercle est réservé à nos membres abonnés. Sélectionnez un plan, effectuez votre paiement via Wave,
            puis patientez quelques instants : notre équipe activera manuellement votre accès dès réception.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
          <PricingCard icon={<Star className="w-6 h-6 text-primary" />} name="Découverte" price="3 000 F" period="/mois"
            features={["Création de profil", "Parcourir les profils", "5 likes par jour", "Support par email"]}
            cta="Choisir Découverte" highlighted={false}
            link="https://pay.wave.com/m/M_ci_FQHZsKYkp65N/c/ci/?amount=3000" />
          <PricingCard icon={<Crown className="w-6 h-6 text-primary" />} name="Premium" price="5 000 F" period="/mois"
            features={["Likes illimités", "Voir qui vous aime", "Messagerie prioritaire", "Profil mis en avant", "Matchmaking assisté"]}
            cta="Choisir Premium" highlighted={true} badge="Populaire"
            link="https://pay.wave.com/m/M_ci_FQHZsKYkp65N/c/ci/?amount=5000" />
          <PricingCard icon={<Diamond className="w-6 h-6 text-primary" />} name="VIP" price="10 000 F" period="/mois"
            features={["Tout Premium inclus", "Concierge personnel", "Événements privés", "Badge or vérifié", "Accès prioritaire"]}
            cta="Devenir VIP" highlighted={false}
            link="https://pay.wave.com/m/M_ci_FQHZsKYkp65N/c/ci/?amount=10000" />
        </div>

        <div className="max-w-2xl mx-auto mt-12 p-6 rounded-2xl bg-card border border-border/50 text-center">
          <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            En attente d'activation ?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Si vous avez déjà effectué votre paiement, notre équipe traite l'activation sous quelques minutes.
            Vous pouvez actualiser pour vérifier votre statut.
          </p>
          {hasBackend && (
            <Button onClick={() => refresh()} variant="outline" className="rounded-full">
              Actualiser mon statut
            </Button>
          )}
          <Button onClick={() => navigate("/onboarding", { replace: true })} className="rounded-full ml-0 md:ml-3">
            J'ai payé — continuer
          </Button>
        </div>
      </section>
    </div>
  );
};

const PricingCard = ({ icon, name, price, period, features, cta, highlighted, badge, link }: {
  icon: React.ReactNode; name: string; price: string; period: string;
  features: string[]; cta: string; highlighted: boolean; badge?: string; link?: string;
}) => (
  <div className={`relative p-8 rounded-2xl border transition-all duration-300 ${
    highlighted ? "bg-card border-primary/60 shadow-xl shadow-primary/10 scale-105" : "bg-card border-border/50 hover:border-primary/30"
  }`}>
    {badge && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold tracking-wide">
        {badge}
      </div>
    )}
    <div className="flex items-center gap-3 mb-6">
      {icon}
      <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>{name}</h3>
    </div>
    <div className="mb-6">
      <span className="text-4xl font-bold text-foreground">{price}</span>
      <span className="text-muted-foreground text-sm">{period}</span>
    </div>
    <ul className="space-y-3 mb-8">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
          <Check className="w-4 h-4 text-primary flex-shrink-0" />{f}
        </li>
      ))}
    </ul>
    <a href={link} target="_blank" rel="noopener noreferrer">
      <Button className={`w-full rounded-full font-semibold ${
        highlighted ? "bg-primary text-primary-foreground hover:bg-primary/85"
                    : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
      }`}>{cta}</Button>
    </a>
  </div>
);

export default Subscribe;