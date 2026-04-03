ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS profile_sender_id uuid,
ADD COLUMN IF NOT EXISTS profile_receiver_id uuid;

-- Update RLS: allow admins to insert messages with profile_sender_id
CREATE POLICY "Admins can send messages as profiles"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all messages
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow users to see messages sent to their profile
CREATE POLICY "Users can view messages to their profile"
ON public.messages
FOR SELECT
TO authenticated
USING (
  profile_receiver_id IN (SELECT id FROM public.profiles WHERE created_by = auth.uid())
  OR profile_sender_id IN (SELECT id FROM public.profiles WHERE created_by = auth.uid())
);