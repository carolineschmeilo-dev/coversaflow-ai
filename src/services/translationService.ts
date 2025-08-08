interface TranslationResult {
  translatedText: string;
  confidence: number;
  needsClarification: boolean;
  originalText: string;
  detectedSlang?: string[];
}

interface SlangPattern {
  pattern: RegExp;
  examples: string[];
  description: string;
}

class TranslationService {
  private slangPatterns: SlangPattern[] = [
    {
      pattern: /\b(fire|lit|bussin|slaps|hits different)\b/i,
      examples: ["fire", "lit", "bussin"],
      description: "modern slang for 'excellent' or 'amazing'"
    },
    {
      pattern: /\b(no cap|fr|ngl|periodt)\b/i,
      examples: ["no cap", "fr", "ngl"],
      description: "emphasis or truth-telling expressions"
    },
    {
      pattern: /\b(vibe|vibes|mood|big mood)\b/i,
      examples: ["vibe", "mood"],
      description: "feeling or atmosphere expressions"
    },
    {
      pattern: /\b(salty|pressed|triggered|sus)\b/i,
      examples: ["salty", "sus"],
      description: "emotional state or suspicion"
    },
    {
      pattern: /\b(fam|bro|bestie|queen|king)\b/i,
      examples: ["fam", "bestie"],
      description: "informal address terms"
    }
  ];

  private confidenceThreshold = 0.7;

  detectSlang(text: string): string[] {
    const detectedSlang: string[] = [];
    
    this.slangPatterns.forEach(pattern => {
      const matches = text.match(pattern.pattern);
      if (matches) {
        detectedSlang.push(...matches.filter(match => match.length > 2));
      }
    });
    
    return detectedSlang;
  }

  calculateConfidence(text: string, detectedSlang: string[]): number {
    const words = text.split(/\s+/).length;
    const slangCount = detectedSlang.length;
    const slangRatio = slangCount / words;
    
    // Lower confidence if high slang ratio
    if (slangRatio > 0.3) return 0.4;
    if (slangRatio > 0.15) return 0.6;
    if (slangCount > 0) return 0.75;
    
    return 0.9;
  }

  async translateWithFallback(
    text: string, 
    sourceLang: string, 
    targetLang: string
  ): Promise<TranslationResult> {
    const detectedSlang = this.detectSlang(text);
    const confidence = this.calculateConfidence(text, detectedSlang);
    
    // If confidence is low, suggest clarification
    if (confidence < this.confidenceThreshold || detectedSlang.length > 0) {
      return {
        translatedText: this.getApproximateTranslation(text, detectedSlang, targetLang),
        confidence,
        needsClarification: true,
        originalText: text,
        detectedSlang
      };
    }

    // Simulate API call to translation service
    const translatedText = await this.performTranslation(text, sourceLang, targetLang);
    
    return {
      translatedText,
      confidence,
      needsClarification: false,
      originalText: text
    };
  }

  private getApproximateTranslation(text: string, slang: string[], targetLang: string): string {
    // Provide best-guess translation with uncertainty indicators
    let result = text;
    
    // Replace common slang with approximations
    const slangMap: Record<string, Record<string, string>> = {
      es: {
        'fire': 'increíble',
        'lit': 'genial',
        'bussin': 'delicioso',
        'no cap': 'en serio',
        'fr': 'de verdad',
        'vibe': 'ambiente',
        'mood': 'estado de ánimo',
        'salty': 'molesto',
        'sus': 'sospechoso',
        'fam': 'amigo'
      },
      fr: {
        'fire': 'incroyable',
        'lit': 'génial',
        'no cap': 'sérieusement',
        'vibe': 'ambiance',
        'mood': 'humeur'
      }
    };

    const translations = slangMap[targetLang] || {};
    
    slang.forEach(term => {
      if (translations[term.toLowerCase()]) {
        result = result.replace(new RegExp(term, 'gi'), translations[term.toLowerCase()]);
      }
    });

    return result;
  }

  private async performTranslation(text: string, sourceLang: string, targetLang: string): Promise<string> {
    // Simulate translation API call
    // In real implementation, this would call Google Translate, DeepL, etc.
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock translation responses
    const mockTranslations: Record<string, string> = {
      'Hello, how are you?': targetLang === 'es' ? 'Hola, ¿cómo estás?' : 'Bonjour, comment allez-vous?',
      'That sounds great!': targetLang === 'es' ? '¡Eso suena genial!' : 'Ça sonne très bien!',
      'I understand': targetLang === 'es' ? 'Entiendo' : 'Je comprends'
    };

    return mockTranslations[text] || `[${targetLang.toUpperCase()}] ${text}`;
  }

  getClarificationMessage(detectedSlang: string[]): string {
    if (detectedSlang.length === 0) {
      return "I'm having trouble with that phrase. Could you rephrase it?";
    }
    
    const slangList = detectedSlang.join(', ');
    return `I detected slang terms (${slangList}). Could you use more standard language for better translation?`;
  }
}

export const translationService = new TranslationService();
export type { TranslationResult };