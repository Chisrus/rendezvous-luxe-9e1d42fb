
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_user_id uuid NOT NULL,
  liked_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (liker_user_id, liked_profile_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own likes" ON public.likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = liker_user_id);

CREATE POLICY "Users can delete own likes" ON public.likes
  FOR DELETE TO authenticated
  USING (auth.uid() = liker_user_id);

CREATE POLICY "Users can view own likes" ON public.likes
  FOR SELECT TO authenticated
  USING (auth.uid() = liker_user_id);

CREATE POLICY "Profile owners can view received likes" ON public.likes
  FOR SELECT TO authenticated
  USING (liked_profile_id IN (SELECT id FROM public.profiles WHERE created_by = auth.uid()));

CREATE POLICY "Admins can view all likes" ON public.likes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_likes_liker ON public.likes(liker_user_id);
CREATE INDEX idx_likes_liked_profile ON public.likes(liked_profile_id);

-- Trigger function: detect mutual match and create notifications
CREATE OR REPLACE FUNCTION public.detect_mutual_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  liked_profile_owner uuid;
  liker_profile_id uuid;
  liker_profile_name text;
  liked_profile_name text;
  mutual_exists boolean;
BEGIN
  -- Find owner of the liked profile
  SELECT created_by, name INTO liked_profile_owner, liked_profile_name
  FROM public.profiles WHERE id = NEW.liked_profile_id;

  IF liked_profile_owner IS NULL OR liked_profile_owner = NEW.liker_user_id THEN
    RETURN NEW;
  END IF;

  -- Check if profile owner has liked any profile owned by the liker
  SELECT EXISTS (
    SELECT 1 FROM public.likes l
    JOIN public.profiles p ON p.id = l.liked_profile_id
    WHERE l.liker_user_id = liked_profile_owner
      AND p.created_by = NEW.liker_user_id
  ) INTO mutual_exists;

  IF mutual_exists THEN
    -- Get liker's profile name
    SELECT name INTO liker_profile_name
    FROM public.profiles WHERE created_by = NEW.liker_user_id LIMIT 1;

    INSERT INTO public.notifications (user_id, title, message)
    VALUES
      (NEW.liker_user_id, 'Nouveau match !', 'Vous avez un match mutuel avec ' || COALESCE(liked_profile_name, 'un membre') || ' ✨'),
      (liked_profile_owner, 'Nouveau match !', 'Vous avez un match mutuel avec ' || COALESCE(liker_profile_name, 'un membre') || ' ✨');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_like_created
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.detect_mutual_match();

ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
