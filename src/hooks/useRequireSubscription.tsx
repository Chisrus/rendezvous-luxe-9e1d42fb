import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Bloque l'accès aux pages membres tant qu'un abonnement payant n'est pas
 * activé par l'admin. Les admins ne sont jamais bloqués.
 */
export const useRequireSubscription = () => {
  const { user, loading: authLoading, isAdmin, onboardingComplete } = useAuth();
  const { plan, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || subLoading || !user) return;
    if (isAdmin) return;
    // Laisser l'onboarding terminer avant de rediriger
    if (onboardingComplete === false) return;
    const exempt = ["/subscribe", "/onboarding", "/auth", "/", "/terms", "/privacy", "/contact"];
    if (exempt.includes(location.pathname)) return;
    if (plan === "free") {
      navigate("/subscribe", { replace: true });
    }
  }, [authLoading, subLoading, user, isAdmin, plan, onboardingComplete, location.pathname, navigate]);
};