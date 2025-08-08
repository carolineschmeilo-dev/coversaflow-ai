import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type CallSession = Database['public']['Tables']['call_sessions']['Row'];
type CallSessionInsert = Database['public']['Tables']['call_sessions']['Insert'];
type Translation = Database['public']['Tables']['translations']['Row'];
type TranslationInsert = Database['public']['Tables']['translations']['Insert'];

export const useCallHistory = () => {
  const [callSessions, setCallSessions] = useState<CallSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CallSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch call history
  const fetchCallHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCallSessions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch call history');
    } finally {
      setLoading(false);
    }
  };

  // Start new call session
  const startCallSession = async (sessionData: Omit<CallSessionInsert, 'user_id'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('call_sessions')
        .insert({ 
          ...sessionData, 
          user_id: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentSession(data);
      setCallSessions(prev => [data, ...prev]);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start call session';
      setError(message);
      throw new Error(message);
    }
  };

  // End call session
  const endCallSession = async (sessionId: string, durationSeconds: number) => {
    try {
      const { data, error } = await supabase
        .from('call_sessions')
        .update({ 
          status: 'completed',
          duration_seconds: durationSeconds,
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      
      setCurrentSession(null);
      setCallSessions(prev => prev.map(s => s.id === sessionId ? data : s));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to end call session';
      setError(message);
      throw new Error(message);
    }
  };

  // Add translation to current session
  const addTranslation = async (translationData: Omit<TranslationInsert, 'user_id'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('translations')
        .insert({ 
          ...translationData, 
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save translation';
      setError(message);
      throw new Error(message);
    }
  };

  // Get translations for a specific call session
  const getSessionTranslations = async (sessionId: string): Promise<Translation[]> => {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('*')
        .eq('call_session_id', sessionId)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to fetch translations:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchCallHistory();
  }, [user]);

  return {
    callSessions,
    currentSession,
    loading,
    error,
    startCallSession,
    endCallSession,
    addTranslation,
    getSessionTranslations,
    refetch: fetchCallHistory
  };
};