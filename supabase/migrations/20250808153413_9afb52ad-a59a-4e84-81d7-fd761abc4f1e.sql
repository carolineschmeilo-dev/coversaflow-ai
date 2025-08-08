-- Fix security issues from the analytics view

-- Drop the insecure view
DROP VIEW IF EXISTS public.analytics_summary;

-- Fix functions with mutable search paths
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- Create a secure function to get analytics data (admin only)
CREATE OR REPLACE FUNCTION public.get_analytics_data(
  start_date date DEFAULT (CURRENT_DATE - INTERVAL '30 days')::date,
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  date date,
  daily_signups bigint,
  daily_calls bigint,
  avg_call_duration numeric,
  daily_translations bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  -- Only allow admin users to call this function
  SELECT 
    DATE(p.created_at) as date,
    COUNT(DISTINCT p.user_id) as daily_signups,
    COUNT(DISTINCT cs.id) as daily_calls,
    AVG(cs.duration_seconds) as avg_call_duration,
    COUNT(DISTINCT t.id) as daily_translations
  FROM public.profiles p
  LEFT JOIN public.call_sessions cs ON p.user_id = cs.user_id 
    AND DATE(cs.created_at) = DATE(p.created_at)
    AND DATE(cs.created_at) BETWEEN start_date AND end_date
  LEFT JOIN public.translations t ON p.user_id = t.user_id 
    AND DATE(t.created_at) = DATE(p.created_at)
    AND DATE(t.created_at) BETWEEN start_date AND end_date
  WHERE DATE(p.created_at) BETWEEN start_date AND end_date
    AND EXISTS (
      SELECT 1 FROM public.profiles admin_check 
      WHERE admin_check.user_id = auth.uid() 
      AND admin_check.is_admin = true
    )
  GROUP BY DATE(p.created_at)
  ORDER BY date DESC;
$$;