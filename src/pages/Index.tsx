import { Shield, Eye, Heart, Check, Crown, Star, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-wide">
            <span className="text-primary font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Rencontre</span>
            <span className="text-foreground font-light">DeLuxe</span>
          </span>
          <a href="/auth">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/85 rounded-full px-6">
              S'inscrire
            </Button>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
            <Diamond className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary tracking-widest uppercase">Exclusif & Confidentiel</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-foreground">
            Rencontres d'Exception<br />
            <span className="text-primary">pour une Élite</span> Exigeante
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Un cercle privé où discrétion, élégance et authenticité se rencontrent. 
            Chaque profil est vérifié, chaque connexion est unique.
          </p>
          <a href="/auth">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/85 rounded-full px-10 py-6 text-base font-semibold tracking-wide shadow-lg shadow-primary/20">
              Rejoindre le Cercle
            </Button>
          </a>
          <p className="mt-4 text-sm text-muted-foreground">Sur invitation ou candidature • 100% confidentiel</p>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
            L'Excellence à Chaque <span className="text-primary">Détail</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-lg mx-auto">
            Une expérience de rencontre pensée pour ceux qui n'acceptent que le meilleur.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Profils Vérifiés", desc: "Chaque membre est authentifié manuellement. Identité, photos et intentions vérifiées par notre équipe." },
              { icon: Eye, title: "Confidentialité Absolue", desc: "Vos données ne sont jamais partagées. Navigation discrète, profil invisible sur demande." },
              { icon: Heart, title: "Matchmaking Personnalisé", desc: "Notre algorithme et nos experts sélectionnent des profils compatibles avec vos critères d'exigence." },
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/40 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
            Votre <span className="text-primary">Abonnement</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-lg mx-auto">
            Choisissez la formule qui correspond à vos ambitions.
          </p>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Découverte */}
            <PricingCard
              icon={<Star className="w-6 h-6 text-primary" />}
              name="Découverte"
              price="3 000 F"
              period="/mois"
              features={["Création de profil", "Parcourir les profils", "5 likes par jour", "Support par email"]}
              cta="Commencer"
              highlighted={false}
              link="https://pay.wave.com/m/M_ci_FQHZsKYkp65N/c/ci/?amount=3000"
            />
            {/* Premium */}
            <PricingCard
              icon={<Crown className="w-6 h-6 text-primary" />}
              name="Premium"
              price="5 000 F"
              period="/mois"
              features={["Likes illimités", "Voir qui vous aime", "Messagerie prioritaire", "Profil mis en avant", "Matchmaking assisté"]}
              cta="Choisir Premium"
              highlighted={true}
              badge="Populaire"
              link="https://pay.wave.com/m/M_ci_FQHZsKYkp65N/c/ci/?amount=5000"
            />
            {/* VIP */}
            <PricingCard
              icon={<Diamond className="w-6 h-6 text-primary" />}
              name="VIP"
              price="10 000 F"
              period="/mois"
              features={["Tout Premium inclus", "Concierge personnel", "Événements privés", "Profil vérifié badge or", "Accès prioritaire nouveaux membres"]}
              cta="Devenir VIP"
              highlighted={false}
              link="https://pay.wave.com/m/M_ci_FQHZsKYkp65N/c/ci/?amount=10000"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-xl font-semibold tracking-wide">
              <span className="text-primary font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Rencontre</span>
              <span className="text-foreground font-light">DeLuxe</span>
            </span>
            <p className="text-muted-foreground text-sm mt-2">L'art de la rencontre d'exception.</p>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Conditions</a>
            <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 RencontreDeLuxe. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

const PricingCard = ({
  icon, name, price, period, features, cta, highlighted, badge, link,
}: {
  icon: React.ReactNode; name: string; price: string; period: string;
  features: string[]; cta: string; highlighted: boolean; badge?: string; link?: string;
}) => (
  <div className={`relative p-8 rounded-2xl border transition-all duration-300 ${
    highlighted
      ? "bg-card border-primary/60 shadow-xl shadow-primary/10 scale-105"
      : "bg-card border-border/50 hover:border-primary/30"
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
          <Check className="w-4 h-4 text-primary flex-shrink-0" />
          {f}
        </li>
      ))}
    </ul>
    <a href={link} target="_blank" rel="noopener noreferrer">
      <Button className={`w-full rounded-full font-semibold ${
        highlighted
          ? "bg-primary text-primary-foreground hover:bg-primary/85"
          : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
      }`}>
        {cta}
      </Button>
    </a>
  </div>
);

export default Index;
