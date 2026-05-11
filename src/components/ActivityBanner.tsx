import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const MESSAGES = [
  "Aïcha (Abidjan) vient de rejoindre Premium",
  "Karim (Dakar) a souscrit VIP",
  "12 nouveaux profils vérifiés cette semaine",
  "Sophie (Paris) a un nouveau match",
  "Mehdi (Casablanca) est devenu Premium",
  "Mariam (Cotonou) a complété son profil",
  "Yasmine (Lyon) vient de s'inscrire",
  "3 événements VIP à venir ce mois-ci",
  "Adama (Bamako) a rejoint le club",
  "Léa (Bruxelles) a trouvé un match exclusif",
];

const ActivityBanner = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 border border-primary/20 backdrop-blur-sm text-xs sm:text-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <Sparkles className="w-3.5 h-3.5 text-primary" />
      <span key={idx} className="text-foreground/90 transition-opacity">
        {MESSAGES[idx]}
      </span>
    </div>
  );
};

export default ActivityBanner;