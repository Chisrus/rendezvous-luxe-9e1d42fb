import { createContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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

    const processUser = async (currentUser: User | null) => {
      if (!mountedRef.current) return;
      setUser(currentUser);

      if (currentUser) {
        const admin = await checkAdmin(currentUser.id);
        if (mountedRef.current) setIsAdmin(admin);
      } else {
        if (mountedRef.current) setIsAdmin(false);
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
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
