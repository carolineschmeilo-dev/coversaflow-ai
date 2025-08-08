-- Add admin role to profiles table
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Create analytics view for easier querying
CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT 
  DATE(p.created_at) as signup_date,
  COUNT(DISTINCT p.user_id) as daily_signups,
  COUNT(DISTINCT cs.id) as daily_calls,
  AVG(cs.duration_seconds) as avg_call_duration,
  COUNT(DISTINCT t.id) as daily_translations
FROM profiles p
LEFT JOIN call_sessions cs ON p.user_id = cs.user_id AND DATE(cs.created_at) = DATE(p.created_at)
LEFT JOIN translations t ON p.user_id = t.user_id AND DATE(t.created_at) = DATE(p.created_at)
GROUP BY DATE(p.created_at)
ORDER BY signup_date DESC;

-- Create RLS policy for analytics view (admin only)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Update existing profile policy to include admin check
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile or admins can view all" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR is_admin = true);

-- Create admin-only policy for analytics
CREATE POLICY "Only admins can view analytics" 
ON public.profiles 
FOR SELECT 
USING (is_admin = true AND auth.uid() = user_id);