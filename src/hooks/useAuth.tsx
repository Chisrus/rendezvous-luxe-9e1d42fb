import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (mounted) setIsAdmin(!!data);
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (mounted) setIsAdmin(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await checkAdmin(currentUser.id);
        } else {
          if (mounted) setIsAdmin(false);
        }
        
        if (mounted) setLoading(false);
      }
    );

    // Initial session check to guarantee loading state resolves
    // even if onAuthStateChange doesn't fire immediately
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (session?.user) {
           setUser(session.user);
           await checkAdmin(session.user.id);
        } else {
           setUser(null);
           setIsAdmin(false);
        }
      } catch (error) {
         console.error("Error getting session:", error);
      } finally {
         if (mounted) setLoading(false);
      }
    };

    initSession();

    // Safety fallback: if everything hangs, force loading to false after 2 seconds
    const fallbackTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth initialization timed out, forcing loading to false");
        setLoading(false);
      }
    }, 2000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [loading]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, isAdmin, signOut };
};
