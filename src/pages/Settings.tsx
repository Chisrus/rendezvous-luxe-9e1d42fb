import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import UserNavbar from "@/components/UserNavbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cacheTtlDefaults } from "@/lib/inboxCache";
import { Settings as SettingsIcon, RotateCcw } from "lucide-react";

const KEY_CONV = "cache_ttl_conversations";
const KEY_MSG = "cache_ttl_messages";

const readStored = (key: string, fallback: number) => {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const Settings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [convTtl, setConvTtl] = useState<number>(cacheTtlDefaults.conversations);
  const [msgTtl, setMsgTtl] = useState<number>(cacheTtlDefaults.messages);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    setConvTtl(readStored(KEY_CONV, cacheTtlDefaults.conversations));
    setMsgTtl(readStored(KEY_MSG, cacheTtlDefaults.messages));
  }, []);

  const save = () => {
    const c = Math.max(0, Math.min(3600, Math.floor(convTtl)));
    const m = Math.max(0, Math.min(3600, Math.floor(msgTtl)));
    window.localStorage.setItem(KEY_CONV, String(c));
    window.localStorage.setItem(KEY_MSG, String(m));
    setConvTtl(c);
    setMsgTtl(m);
    toast({ title: "Préférences enregistrées", description: "La nouvelle durée de cache est appliquée immédiatement." });
  };

  const reset = () => {
    window.localStorage.removeItem(KEY_CONV);
    window.localStorage.removeItem(KEY_MSG);
    setConvTtl(cacheTtlDefaults.conversations);
    setMsgTtl(cacheTtlDefaults.messages);
    toast({ title: "Valeurs par défaut restaurées" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Chargement...</div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />
      <div className="pt-20 px-4 md:px-6 max-w-2xl mx-auto pb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          <SettingsIcon className="w-7 h-7 text-primary" /> Paramètres
        </h1>
        <p className="text-muted-foreground mb-8">
          Ajustez la durée de mise en cache pour la messagerie. 0 = aucune mise en cache, max 3600 s (1 h).
        </p>

        <div className="space-y-6 bg-card border border-border/50 rounded-2xl p-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cache des conversations (secondes)
            </label>
            <input
              type="number"
              min={0}
              max={3600}
              value={convTtl}
              onChange={(e) => setConvTtl(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-xl bg-background border border-border/50 text-foreground focus:outline-none focus:border-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">Liste des discussions dans /inbox.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cache des messages (secondes)
            </label>
            <input
              type="number"
              min={0}
              max={3600}
              value={msgTtl}
              onChange={(e) => setMsgTtl(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-xl bg-background border border-border/50 text-foreground focus:outline-none focus:border-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">Historique des messages d'une conversation ouverte.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={save} className="rounded-full bg-primary text-primary-foreground">
              Enregistrer
            </Button>
            <Button onClick={reset} variant="outline" className="rounded-full">
              <RotateCcw className="w-4 h-4 mr-1" /> Réinitialiser
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;