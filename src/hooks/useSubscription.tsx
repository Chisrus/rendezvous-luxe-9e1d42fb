import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Plan = "free" | "discovery" | "premium" | "vip";

const RANK: Record<Plan, number> = { free: 0, discovery: 1, premium: 2, vip: 3 };

export const useSubscription = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan("free");
      setLoading(false);
      return;
    }
    const { data } = await supabase.rpc("get_user_plan", { _user_id: user.id });
    setPlan(((data as Plan) ?? "free") as Plan);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const isAtLeast = (min: Plan) => RANK[plan] >= RANK[min];

  // isFree ne doit être vrai qu'une fois le statut chargé,
  // pour éviter d'afficher des UI "free" (paywall, badge limite, teaser)
  // à un membre Premium pendant le chargement initial.
  return { plan, loading, refresh, isAtLeast, isFree: !loading && plan === "free" };
};