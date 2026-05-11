import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

const PERKS = [
  "Likes illimités",
  "Messages illimités",
  "Voir qui vous a liké·e",
  "Profil mis en avant",
  "Filtres avancés",
];

const PaywallModal = ({ open, onClose, title, description }: PaywallModalProps) => {
  const navigate = useNavigate();

  const goToPricing = () => {
    onClose();
    navigate("/#pricing");
    setTimeout(() => {
      const el = document.getElementById("pricing");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border/50 max-w-md">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-2">
            <Crown className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            {title ?? "Passez Premium"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {description ?? "Vous avez atteint votre limite gratuite. Débloquez l'expérience complète."}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 my-4">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-primary shrink-0" /> {p}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <Button onClick={goToPricing} className="w-full rounded-full bg-primary text-primary-foreground">
            <Crown className="w-4 h-4 mr-2" /> Voir les abonnements
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full text-muted-foreground">
            Plus tard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaywallModal;