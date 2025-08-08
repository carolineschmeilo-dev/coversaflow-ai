import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Star, StarOff, Edit, Trash2, Phone, User } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { toast } from "sonner";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
];

interface ContactsManagerProps {
  onSelectContact?: (contact: any) => void;
  showCallButton?: boolean;
}

export const ContactsManager = ({ onSelectContact, showCallButton = false }: ContactsManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    preferred_language: "en",
    notes: "",
    is_favorite: false
  });

  const { contacts, favorites, loading, addContact, updateContact, deleteContact, toggleFavorite } = useContacts();

  const resetForm = () => {
    setFormData({
      name: "",
      phone_number: "",
      preferred_language: "en",
      notes: "",
      is_favorite: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingContact) {
        await updateContact(editingContact.id, formData);
        toast.success("Contact updated successfully!");
        setEditingContact(null);
      } else {
        await addContact(formData);
        toast.success("Contact added successfully!");
        setIsAddDialogOpen(false);
      }
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save contact");
    }
  };

  const handleEdit = (contact: any) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone_number: contact.phone_number,
      preferred_language: contact.preferred_language || "en",
      notes: contact.notes || "",
      is_favorite: contact.is_favorite || false
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete contact "${name}"?`)) {
      try {
        await deleteContact(id);
        toast.success("Contact deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete contact");
      }
    }
  };

  const handleCall = (contact: any) => {
    if (onSelectContact) {
      onSelectContact(contact);
    }
  };

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || code;
  };

  const getLanguageFlag = (code: string) => {
    return languages.find(lang => lang.code === code)?.flag || "🌐";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contacts</h2>
          <p className="text-muted-foreground">Manage your translation contacts</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Add a contact for easier translation calls
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contact name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1234567890"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language</Label>
                <Select
                  value={formData.preferred_language}
                  onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any notes about this contact..."
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="favorite"
                  checked={formData.is_favorite}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_favorite: checked })}
                />
                <Label htmlFor="favorite">Add to favorites</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Contact</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>Favorites</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((contact) => (
                <div key={contact.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{contact.name}</h3>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </div>
                  <p className="text-sm text-muted-foreground">{contact.phone_number}</p>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs">{getLanguageFlag(contact.preferred_language || 'en')}</span>
                    <span className="text-xs">{getLanguageName(contact.preferred_language || 'en')}</span>
                  </div>
                  {showCallButton && (
                    <Button size="sm" onClick={() => handleCall(contact)} className="w-full">
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Contacts */}
      <Card>
        <CardHeader>
          <CardTitle>All Contacts ({contacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No contacts yet</p>
              <p className="text-sm text-muted-foreground">Add your first contact to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{contact.name}</h3>
                        {contact.is_favorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{contact.phone_number}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getLanguageFlag(contact.preferred_language || 'en')} {getLanguageName(contact.preferred_language || 'en')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {showCallButton && (
                      <Button size="sm" onClick={() => handleCall(contact)}>
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleFavorite(contact.id)}
                    >
                      {contact.is_favorite ? (
                        <StarOff className="w-4 h-4" />
                      ) : (
                        <Star className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(contact)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(contact.id, contact.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contact name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1234567890"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-language">Preferred Language</Label>
              <Select
                value={formData.preferred_language}
                onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any notes about this contact..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-favorite"
                checked={formData.is_favorite}
                onCheckedChange={(checked) => setFormData({ ...formData, is_favorite: checked })}
              />
              <Label htmlFor="edit-favorite">Favorite contact</Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditingContact(null)}>
                Cancel
              </Button>
              <Button type="submit">Update Contact</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};