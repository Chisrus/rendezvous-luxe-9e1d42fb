import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Diamond } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) navigate("/profiles", { replace: true });
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Email envoyé", description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe." });
        setIsForgot(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Bienvenue !", description: "Connexion réussie." });
        navigate("/profiles");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: "Inscription réussie", description: "Vérifiez votre email pour confirmer votre compte." });
      }
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>;

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
            <span className="text-sm text-primary tracking-widest uppercase">
              {isForgot ? "Mot de passe oublié" : isLogin ? "Connexion" : "Inscription"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border/50 rounded-2xl p-8">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="bg-background border-border/50 focus:border-primary"
            />
          </div>
          {!isForgot && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Mot de passe</Label>
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
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/85 rounded-full font-semibold"
          >
            {loading
              ? "Chargement..."
              : isForgot
              ? "Envoyer le lien"
              : isLogin
              ? "Se connecter"
              : "S'inscrire"}
          </Button>

          {isLogin && !isForgot && (
            <p className="text-center">
              <button type="button" onClick={() => setIsForgot(true)} className="text-sm text-primary hover:underline">
                Mot de passe oublié ?
              </button>
            </p>
          )}

          {isForgot ? (
            <p className="text-center text-sm text-muted-foreground">
              <button type="button" onClick={() => setIsForgot(false)} className="text-primary hover:underline">
                Retour à la connexion
              </button>
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Pas encore membre ?" : "Déjà membre ?"}{" "}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
                {isLogin ? "S'inscrire" : "Se connecter"}
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Auth;
