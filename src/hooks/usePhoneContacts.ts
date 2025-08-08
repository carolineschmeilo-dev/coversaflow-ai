import { useState, useEffect } from 'react';
import { Contacts } from '@capacitor-community/contacts';
import { Capacitor } from '@capacitor/core';

export interface PhoneContact {
  id: string;
  name: string;
  phoneNumbers: string[];
}

interface UsePhoneContactsReturn {
  contacts: PhoneContact[];
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  hasPermission: boolean;
}

export const usePhoneContacts = (): UsePhoneContactsReturn => {
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      setError('Contact access only available on mobile devices');
      return false;
    }

    try {
      const permission = await Contacts.requestPermissions();
      const granted = permission.contacts === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        await loadContacts();
      } else {
        setError('Permission denied to access contacts');
      }
      
      return granted;
    } catch (err) {
      setError('Failed to request contact permissions');
      return false;
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
        }
      });

      const formattedContacts: PhoneContact[] = result.contacts
        .filter(contact => contact.phones && contact.phones.length > 0)
        .map(contact => ({
          id: contact.contactId || '',
          name: contact.name?.display || 'Unknown',
          phoneNumbers: contact.phones?.map(phone => phone.number || '') || []
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setContacts(formattedContacts);
    } catch (err) {
      setError('Failed to load contacts');
      console.error('Contact loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we already have permission on mount
    if (Capacitor.isNativePlatform()) {
      Contacts.checkPermissions().then(permission => {
        const granted = permission.contacts === 'granted';
        setHasPermission(granted);
        if (granted) {
          loadContacts();
        }
      });
    }
  }, []);

  return {
    contacts,
    loading,
    error,
    requestPermission,
    hasPermission
  };
};