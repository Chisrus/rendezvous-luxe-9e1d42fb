import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Garde-fou : redirige vers /onboarding tant que le profil n'a pas
 * une bio ET une photo. S'appuie sur AuthContext (cache localStorage
 * + vérification serveur) pour éviter une boucle ou un flash.
 */
export const useRequireOnboarding = () => {
  const { user, loading, onboardingComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    if (location.pathname === "/onboarding" || location.pathname === "/profile/edit") return;
    if (onboardingComplete === false) navigate("/onboarding", { replace: true });
  }, [user, loading, onboardingComplete, location.pathname, navigate]);

  return { ready: !loading && onboardingComplete !== null };
};
