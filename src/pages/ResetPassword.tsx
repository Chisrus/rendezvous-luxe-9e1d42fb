import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Diamond } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Succès", description: "Votre mot de passe a été réinitialisé." });
      navigate("/profiles");
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground">Lien de réinitialisation invalide ou expiré.</p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate("/auth")}>
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <a href="/" className="inline-block">
            <span className="text-2xl font-semibold tracking-wide">
              <span className="text-primary font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Rencontre</span>
              <span className="text-foreground font-light">DeLuxe</span>
            </span>
          </a>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Diamond className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary tracking-widest uppercase">Nouveau mot de passe</span>
          </div>
        </div>
        <form onSubmit={handleReset} className="space-y-6 bg-card border border-border/50 rounded-2xl p-8">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Nouveau mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="bg-background border-border/50 focus:border-primary"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/85 rounded-full font-semibold">
            {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
