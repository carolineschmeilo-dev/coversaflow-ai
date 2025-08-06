import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface SecretFormProps {
  onSecretAdded: () => void;
}

export function SecretForm({ onSecretAdded }: SecretFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your ElevenLabs API key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Store the API key in Supabase secrets
      const response = await fetch('/api/store-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'ELEVENLABS_API_KEY',
          value: apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to store API key');
      }

      toast({
        title: "Success",
        description: "ElevenLabs API key stored successfully!",
      });
      
      onSecretAdded();
    } catch (error) {
      console.error('Error storing API key:', error);
      toast({
        title: "Error",
        description: "Failed to store API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Add ElevenLabs API Key</h3>
          <p className="text-sm text-muted-foreground">
            Enter your ElevenLabs API key to enable audio functionality.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="sk_..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
          />
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Storing..." : "Store API Key"}
        </Button>
      </form>
    </Card>
  );
}