
CREATE TYPE public.subscription_plan AS ENUM ('discovery', 'premium', 'vip');
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled');

CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan public.subscription_plan NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE UNIQUE INDEX idx_subscriptions_unique_active
  ON public.subscriptions(user_id) WHERE status = 'active';

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert subscriptions"
  ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update subscriptions"
  ON public.subscriptions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete subscriptions"
  ON public.subscriptions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Returns current effective plan, considering expiry
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT plan::text FROM public.subscriptions
      WHERE user_id = _user_id
        AND status = 'active'
        AND (current_period_end IS NULL OR current_period_end > now())
      ORDER BY
        CASE plan WHEN 'vip' THEN 3 WHEN 'premium' THEN 2 WHEN 'discovery' THEN 1 END DESC
      LIMIT 1
    ),
    'free'
  );
$$;

-- Plan ranks: free=0, discovery=1, premium=2, vip=3
CREATE OR REPLACE FUNCTION public.is_subscribed(_user_id uuid, _min_plan text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE public.get_user_plan(_user_id)
      WHEN 'vip' THEN 3
      WHEN 'premium' THEN 2
      WHEN 'discovery' THEN 1
      ELSE 0
    END
    >=
    CASE _min_plan
      WHEN 'vip' THEN 3
      WHEN 'premium' THEN 2
      WHEN 'discovery' THEN 1
      ELSE 0
    END;
$$;

-- Counts likes given today by a user
CREATE OR REPLACE FUNCTION public.count_likes_today(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.likes
  WHERE liker_user_id = _user_id
    AND created_at >= date_trunc('day', now());
$$;

-- Counts messages sent today by a user
CREATE OR REPLACE FUNCTION public.count_messages_today(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.messages
  WHERE sender_id = _user_id
    AND created_at >= date_trunc('day', now());
$$;
