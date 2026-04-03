-- Migration to allow Admin-created Mock Profiles to send/receive messages

-- 1. Drop NOT NULL constraints on sender_id and receiver_id
ALTER TABLE public.messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE public.messages ALTER COLUMN receiver_id DROP NOT NULL;

-- 2. Add profile references for Mock Profile IDs
ALTER TABLE public.messages ADD COLUMN profile_sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN profile_receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Update RLS Policies to allow admins full read/write access to all messages
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT TO authenticated USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR 
    public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id OR 
    public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;
CREATE POLICY "Users can mark messages as read" ON public.messages
  FOR UPDATE TO authenticated USING (
    auth.uid() = receiver_id OR 
    public.has_role(auth.uid(), 'admin')
  );

-- 4. Create a trigger to automatically add real users to the profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, created_by)
  VALUES (new.id, split_part(new.email, '@', 1), new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
