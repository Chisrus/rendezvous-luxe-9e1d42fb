  const handleSignup = async () => {
    setLoading(true);
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
        throw new Error(
          "Configuration Supabase manquante. Les variables VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY doivent être définies."
        );
      }
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { name: name.trim(), gender, orientation },
        },
      });
      if (error) throw error;
      // Le trigger handle_new_user crée le profil de base automatiquement
      // (avec name/gender/orientation lus depuis raw_user_meta_data).
      const hasSession = !!data.session;
      toast({
        title: hasSession ? "Bienvenue dans le Cercle ✨" : "Inscription créée ✨",
        description: hasSession
          ? "Votre compte est prêt. Complétez votre profil maintenant."
          : "Vérifiez votre email pour confirmer votre compte.",
      });
      resetSignup();
      if (hasSession) {
        navigate("/onboarding", { replace: true });
        return;
      }
      setMode("login");
    } catch (err: any) {
      console.error("Erreur inscription détaillée:", err);
      const errorMsg = err?.message || "Une erreur est survenue lors de l'inscription";
      toast({ title: "Erreur inscription", description: errorMsg, variant: "destructive" });
    } finally { setLoading(false); }
  };
