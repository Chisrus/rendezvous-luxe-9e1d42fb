const Terms = () => (
  <div className="min-h-screen bg-background px-6 py-20 max-w-3xl mx-auto">
    <a href="/" className="text-xl font-semibold tracking-wide inline-block mb-10">
      <span className="text-primary font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Rencontre</span>
      <span className="text-foreground font-light">DeLuxe</span>
    </a>
    <h1 className="text-3xl font-bold text-foreground mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Conditions Générales d'Utilisation</h1>
    <div className="prose prose-invert max-w-none text-muted-foreground space-y-4 text-sm leading-relaxed">
      <p>Bienvenue sur RencontreDeLuxe. En utilisant notre plateforme, vous acceptez les présentes conditions.</p>
      <h2 className="text-foreground text-lg font-semibold mt-6">1. Objet</h2>
      <p>RencontreDeLuxe est une plateforme de mise en relation entre personnes majeures à la recherche de rencontres de qualité.</p>
      <h2 className="text-foreground text-lg font-semibold mt-6">2. Inscription</h2>
      <p>L'inscription est réservée aux personnes majeures. Vous vous engagez à fournir des informations exactes et à maintenir la confidentialité de vos identifiants de connexion.</p>
      <h2 className="text-foreground text-lg font-semibold mt-6">3. Comportement</h2>
      <p>Tout comportement irrespectueux, harcèlement ou utilisation frauduleuse entraînera la suspension immédiate du compte sans préavis ni remboursement.</p>
      <h2 className="text-foreground text-lg font-semibold mt-6">4. Abonnements</h2>
      <p>Les abonnements sont non remboursables sauf en cas de dysfonctionnement avéré de la plateforme. Les tarifs sont affichés en Francs CFA.</p>
      <h2 className="text-foreground text-lg font-semibold mt-6">5. Contact</h2>
      <p>Pour toute question, contactez-nous via la page Contact.</p>
    </div>
  </div>
);

export default Terms;
