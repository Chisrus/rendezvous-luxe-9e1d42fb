import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const Contact = () => (
  <div className="min-h-screen bg-background px-6 py-20 max-w-3xl mx-auto">
    <a href="/" className="text-xl font-semibold tracking-wide inline-block mb-10">
      <span className="text-primary font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Rencontre</span>
      <span className="text-foreground font-light">DeLuxe</span>
    </a>
    <h1 className="text-3xl font-bold text-foreground mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Contactez-nous</h1>
    <div className="bg-card border border-border/50 rounded-2xl p-8 space-y-6">
      <p className="text-muted-foreground">Une question, une suggestion ou un problème ? Notre équipe est à votre disposition.</p>
      <div className="flex items-center gap-3">
        <Mail className="w-5 h-5 text-primary" />
        <a href="mailto:contact@rencontredeluxe.com" className="text-primary hover:underline">contact@rencontredeluxe.com</a>
      </div>
      <p className="text-sm text-muted-foreground">Nous répondons généralement sous 24 à 48 heures ouvrées.</p>
      <Button variant="outline" className="rounded-full" onClick={() => window.history.back()}>
        ← Retour
      </Button>
    </div>
  </div>
);

export default Contact;
