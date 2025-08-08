import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Search, Phone, Smartphone } from "lucide-react";
import { usePhoneContacts, PhoneContact } from "@/hooks/usePhoneContacts";
import { Capacitor } from "@capacitor/core";

interface ContactPickerProps {
  onSelectContact: (phoneNumber: string, name?: string) => void;
  children: React.ReactNode;
}

export const ContactPicker = ({ onSelectContact, children }: ContactPickerProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { contacts, loading, error, requestPermission, hasPermission } = usePhoneContacts();

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phoneNumbers.some(number => number.includes(searchTerm))
  );

  const handleContactSelect = (contact: PhoneContact, phoneNumber: string) => {
    onSelectContact(phoneNumber, contact.name);
    setOpen(false);
    setSearchTerm("");
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  // Show different UI based on platform
  if (!Capacitor.isNativePlatform()) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Contact Access
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Mobile App Feature</h3>
              <p className="text-sm text-muted-foreground">
                Contact access is available when using the mobile app on your phone or tablet.
                In the browser, you'll need to enter phone numbers manually.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Contact
          </DialogTitle>
        </DialogHeader>
        
        {!hasPermission ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Access Your Phone Book</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Allow CoversaFlow to access your phone book to quickly select who to call.
              </p>
              <Button onClick={handleRequestPermission}>
                <Users className="w-4 h-4 mr-2" />
                Allow Contact Access
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search phone book..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading phone book...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRequestPermission} className="mt-2">
                  Try Again
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-80">
                <div className="space-y-2">
                  {filteredContacts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? "No people found" : "No phone book entries available"}
                      </p>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div key={contact.id} className="space-y-1">
                        {contact.phoneNumbers.map((phoneNumber, index) => (
                          <button
                            key={`${contact.id}-${index}`}
                            onClick={() => handleContactSelect(contact, phoneNumber)}
                            className="w-full p-3 text-left rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Phone className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{contact.name}</p>
                                <p className="text-sm text-muted-foreground">{phoneNumber}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};