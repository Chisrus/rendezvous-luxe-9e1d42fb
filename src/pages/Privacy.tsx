const Privacy = () => (
  <div className="min-h-screen bg-background px-6 py-20 max-w-3xl mx-auto">
    <a href="/" className="text-xl font-semibold tracking-wide inline-block mb-10">
      <span className="text-primary font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Rencontre</span>
      <span className="text-foreground font-light">DeLuxe</span>
    </a>
    <h1 className="text-3xl font-bold text-foreground mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Politique de Confidentialité</h1>
    <div className="prose prose-invert max-w-none text-muted-foreground space-y-4 text-sm leading-relaxed">
      <p>Votre vie privée est au cœur de notre engagement. Cette politique décrit comment nous collectons, utilisons et protégeons vos données.</p>
      <h2 className="text-foreground text-lg font-semibold mt-6">Données collectées</h2>
      <p>Nous collectons les informations que vous fournissez lors de l'inscription : email, nom, photo, ville, centres d'intérêt. Aucune donnée n'est revendue à des tiers.</p>
      <h2 className="text-foreground text-lg font-semibold mt-6">Utilisation</h2>
      <p>Vos données sont utilisées uniquement pour le fonctionnement de la plateforme : affichage de votre profil, mise en relation et communication entre membres.</p>
      <h2 className="text-foreground text-lg font-semibold mt-6">Sécurité</h2>
      <p>Nous mettons en œuvre des mesures techniques avancées pour protéger vos données, incluant le chiffrement et le contrôle d'accès strict.</p>
      <h2 className="text-foreground text-lg font-semibold mt-6">Droits</h2>
      <p>Vous pouvez à tout moment demander la modification ou la suppression de vos données en nous contactant.</p>
    </div>
  </div>
);

export default Privacy;
