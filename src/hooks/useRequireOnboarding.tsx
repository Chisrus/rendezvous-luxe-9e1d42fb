import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Garde-fou : redirige vers /onboarding tant que le profil
 * n'a pas une bio ET une photo. À utiliser sur les pages "membres".
 */
export const useRequireOnboarding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (location.pathname === "/onboarding" || location.pathname === "/profile/edit") {
      setChecked(true);
      return;
    }
    let active = true;
    supabase
      .from("profiles")
      .select("bio, photo_url")
      .eq("created_by", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const complete = !!(data?.bio && data?.bio.trim().length > 0 && data?.photo_url);
        if (!complete) navigate("/onboarding", { replace: true });
        setChecked(true);
      });
    return () => { active = false; };
  }, [user, loading, location.pathname, navigate]);

  return { ready: checked };
};
