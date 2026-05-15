import { createContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  onboardingComplete: boolean | null;
  refreshOnboarding: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  onboardingComplete: null,
  refreshOnboarding: async () => {},
  signOut: async () => {},
});

const ONB_KEY = (uid: string) => `rdl:onb:${uid}`;

const clearOnbCache = (uid?: string | null) => {
  try {
    if (uid) localStorage.removeItem(ONB_KEY(uid));
    else {
      // Purge any stale onboarding cache (e.g. multi-account)
      Object.keys(localStorage)
        .filter((k) => k.startsWith("rdl:onb:"))
        .forEach((k) => localStorage.removeItem(k));
    }
  } catch {}
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const checkAdmin = async (userId: string): Promise<boolean> => {
      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        return !!data;
      } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
    };

    const checkOnboarding = async (userId: string): Promise<boolean> => {
      try {
        // Source autoritaire côté serveur (évite divergences cache/DB)
        const { data, error } = await supabase.rpc("is_onboarding_complete", { _user_id: userId });
        if (!error && typeof data === "boolean") return data;
        const { data: row } = await supabase
          .from("profiles")
          .select("bio, photo_url")
          .eq("created_by", userId)
          .maybeSingle();
        return !!(row?.bio && row.bio.trim().length >= 20 && row?.photo_url);
      } catch {
        return false;
      }
    };

    const processUser = async (currentUser: User | null) => {
      if (!mountedRef.current) return;
      setUser(currentUser);

      if (currentUser) {
        // Hydrate from cache for instant client-side check (no flicker)
        try {
          const cached = localStorage.getItem(ONB_KEY(currentUser.id));
          if (cached === "1" || cached === "0") {
            setOnboardingComplete(cached === "1");
          }
        } catch {}
        const admin = await checkAdmin(currentUser.id);
        if (mountedRef.current) setIsAdmin(admin);
        const done = await checkOnboarding(currentUser.id);
        if (mountedRef.current) {
          setOnboardingComplete(done);
          try { localStorage.setItem(ONB_KEY(currentUser.id), done ? "1" : "0"); } catch {}
        }
      } else {
        if (mountedRef.current) setIsAdmin(false);
        if (mountedRef.current) setOnboardingComplete(null);
      }

      if (mountedRef.current) setLoading(false);
    };

    // Set up the auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Fire and forget - don't await inside the callback
        processUser(session?.user ?? null);
      }
    );

    // Safety fallback - if nothing fires within 8s, stop loading
    const fallbackTimer = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
      }
    }, 8000);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []); // Empty dependency array - run only once

  const signOut = async () => {
    clearOnbCache(user?.id);
    await supabase.auth.signOut();
  };

  const refreshOnboarding = async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc("is_onboarding_complete", { _user_id: user.id });
    let done: boolean;
    if (!error && typeof data === "boolean") {
      done = data;
    } else {
      const { data: row } = await supabase
        .from("profiles")
        .select("bio, photo_url")
        .eq("created_by", user.id)
        .maybeSingle();
      done = !!(row?.bio && row.bio.trim().length >= 20 && row?.photo_url);
    }
    setOnboardingComplete(done);
    try { localStorage.setItem(ONB_KEY(user.id), done ? "1" : "0"); } catch {}
  };

  // Realtime invalidation: dès que la ligne profil de l'utilisateur change,
  // on rafraîchit le statut d'onboarding (et donc le cache localStorage).
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile-onb-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `created_by=eq.${user.id}` },
        () => { refreshOnboarding(); }
      )
      .subscribe();
    // Si une autre fenêtre/onglet vide le cache, on resynchronise
    const onStorage = (e: StorageEvent) => {
      if (e.key === ONB_KEY(user.id)) refreshOnboarding();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, onboardingComplete, refreshOnboarding, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
