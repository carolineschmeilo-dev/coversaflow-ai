-- Create contacts table for saving frequent contacts
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  is_favorite BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, phone_number)
);

-- Create call_sessions table for call history
CREATE TABLE public.call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  user_language TEXT NOT NULL DEFAULT 'en',
  contact_language TEXT NOT NULL DEFAULT 'es',
  duration_seconds INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('active', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create translations table for storing individual translations within calls
CREATE TABLE public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  speaker TEXT NOT NULL CHECK (speaker IN ('user', 'contact')),
  confidence_score DECIMAL(3,2) DEFAULT 0.95,
  detected_gender TEXT CHECK (detected_gender IN ('male', 'female', 'unknown')),
  voice_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY "Users can view their own contacts" 
ON public.contacts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" 
ON public.contacts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" 
ON public.contacts 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for call_sessions
CREATE POLICY "Users can view their own call sessions" 
ON public.call_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call sessions" 
ON public.call_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own call sessions" 
ON public.call_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for translations
CREATE POLICY "Users can view their own translations" 
ON public.translations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own translations" 
ON public.translations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_call_sessions_updated_at
  BEFORE UPDATE ON public.call_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_favorites ON public.contacts(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_call_sessions_user_id ON public.call_sessions(user_id);
CREATE INDEX idx_call_sessions_recent ON public.call_sessions(user_id, started_at DESC);
CREATE INDEX idx_translations_call_session ON public.translations(call_session_id);
CREATE INDEX idx_translations_user_recent ON public.translations(user_id, created_at DESC);