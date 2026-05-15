
-- Attach the handle_new_user trigger so every new auth user gets a profile row
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any auth users missing a profile (prevents future onboarding loops)
INSERT INTO public.profiles (id, name, created_by)
SELECT u.id,
       COALESCE(split_part(u.email, '@', 1), 'Utilisateur'),
       u.id
FROM auth.users u
LEFT JOIN public.profiles p ON p.created_by = u.id
WHERE p.id IS NULL;

-- Guard: once bio or photo_url is set on a profile, prevent it from being cleared
CREATE OR REPLACE FUNCTION public.prevent_onboarding_regression()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.photo_url IS NOT NULL AND OLD.photo_url <> ''
     AND (NEW.photo_url IS NULL OR NEW.photo_url = '') THEN
    NEW.photo_url := OLD.photo_url;
  END IF;
  IF OLD.bio IS NOT NULL AND length(trim(OLD.bio)) > 0
     AND (NEW.bio IS NULL OR length(trim(NEW.bio)) = 0) THEN
    NEW.bio := OLD.bio;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_onboarding_regression ON public.profiles;
CREATE TRIGGER profiles_prevent_onboarding_regression
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_onboarding_regression();

-- Helper RPC for the frontend to authoritatively check onboarding completion
CREATE OR REPLACE FUNCTION public.is_onboarding_complete(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE created_by = _user_id
      AND photo_url IS NOT NULL AND photo_url <> ''
      AND bio IS NOT NULL AND length(trim(bio)) >= 20
  );
$$;
