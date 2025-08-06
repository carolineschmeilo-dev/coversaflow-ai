import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function EarlyAccessSignup() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('early_access_signups')
        .insert([
          { 
            email: email.toLowerCase().trim(),
            source: 'homepage',
            metadata: { 
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent 
            }
          }
        ]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Subscribed",
            description: "This email is already receiving updates!",
            variant: "default",
          });
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        toast({
          title: "Thanks for Subscribing!",
          description: "You'll receive updates about new features and improvements.",
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="p-6 bg-gradient-to-r from-success/10 to-primary/10 border-success/20">
        <div className="text-center space-y-3">
          <CheckCircle className="w-12 h-12 mx-auto text-success" />
          <h3 className="text-lg font-semibold text-success">You're Subscribed!</h3>
          <p className="text-sm text-muted-foreground">
            Thanks! You'll receive updates about new features and improvements.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Get Updates</h3>
          <p className="text-sm text-muted-foreground">
            Stay updated on new features, language additions, and improvements to ConversaFlow.AI.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Enter your email for updates"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !email}
              className="shrink-0"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            No spam, just updates on new features and improvements.
          </p>
        </form>
      </div>
    </Card>
  );
}