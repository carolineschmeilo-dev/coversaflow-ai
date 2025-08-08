import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type Contact = Database['public']['Tables']['contacts']['Row'];
type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch contacts
  const fetchContacts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  // Add contact
  const addContact = async (contact: Omit<ContactInsert, 'user_id'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({ ...contact, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setContacts(prev => [...prev, data]);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add contact';
      setError(message);
      throw new Error(message);
    }
  };

  // Update contact
  const updateContact = async (id: string, updates: ContactUpdate) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setContacts(prev => prev.map(c => c.id === id ? data : c));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update contact';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete contact
  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete contact';
      setError(message);
      throw new Error(message);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;

    await updateContact(id, { is_favorite: !contact.is_favorite });
  };

  // Get favorites
  const favorites = contacts.filter(c => c.is_favorite);

  useEffect(() => {
    fetchContacts();
  }, [user]);

  return {
    contacts,
    favorites,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    toggleFavorite,
    refetch: fetchContacts
  };
};