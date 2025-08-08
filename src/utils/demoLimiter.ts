// Demo usage tracking and limitations
export class DemoLimiter {
  private static readonly STORAGE_KEY = 'conversaflow_demo_usage';
  private static readonly MAX_DAILY_DEMOS = 3;
  private static readonly DEMO_DURATION_LIMIT = 300; // 5 minutes max
  
  // Track demo usage with multiple identifiers
  static trackDemoUsage() {
    const usage = this.getDemoUsage();
    const today = new Date().toDateString();
    
    // Create multiple tracking identifiers
    const fingerprint = this.generateFingerprint();
    
    if (!usage[today]) {
      usage[today] = {};
    }
    
    if (!usage[today][fingerprint]) {
      usage[today][fingerprint] = 0;
    }
    
    usage[today][fingerprint]++;
    
    // Store in multiple places
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
    
    // Also store in IndexedDB for persistence
    this.storeInIndexedDB(usage);
  }
  
  static canUseDemo(): { allowed: boolean; remaining: number; reason?: string } {
    const usage = this.getDemoUsage();
    const today = new Date().toDateString();
    const fingerprint = this.generateFingerprint();
    
    const todayUsage = usage[today]?.[fingerprint] || 0;
    const remaining = Math.max(0, this.MAX_DAILY_DEMOS - todayUsage);
    
    if (todayUsage >= this.MAX_DAILY_DEMOS) {
      return {
        allowed: false,
        remaining: 0,
        reason: 'Daily demo limit reached. Create a free account for unlimited access.'
      };
    }
    
    return {
      allowed: true,
      remaining
    };
  }
  
  private static getDemoUsage(): Record<string, Record<string, number>> {
    try {
      // Try multiple storage sources
      const localStorage = window.localStorage.getItem(this.STORAGE_KEY);
      const sessionStorage = window.sessionStorage.getItem(this.STORAGE_KEY);
      
      if (localStorage) {
        return JSON.parse(localStorage);
      }
      if (sessionStorage) {
        return JSON.parse(sessionStorage);
      }
      
      return {};
    } catch {
      return {};
    }
  }
  
  private static generateFingerprint(): string {
    // Create a semi-persistent fingerprint (harder to bypass)
    const screen = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    const userAgent = navigator.userAgent.slice(0, 50); // Partial UA
    
    const fingerprint = `${screen}-${timezone}-${language}-${platform}-${userAgent}`;
    return btoa(fingerprint).slice(0, 16); // Shortened hash
  }
  
  private static async storeInIndexedDB(usage: Record<string, Record<string, number>>) {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['demo_usage'], 'readwrite');
      const store = transaction.objectStore('demo_usage');
      await store.put({ id: 'usage', data: usage });
    } catch (error) {
      console.log('IndexedDB storage failed:', error);
    }
  }
  
  private static openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ConversaFlowDemo', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('demo_usage')) {
          db.createObjectStore('demo_usage', { keyPath: 'id' });
        }
      };
    });
  }
  
  // Additional security: Time-based limits
  static createDemoSession() {
    const sessionStart = Date.now();
    sessionStorage.setItem('demo_start_time', sessionStart.toString());
    
    // Auto-end demo after time limit
    setTimeout(() => {
      if (sessionStorage.getItem('demo_start_time') === sessionStart.toString()) {
        this.endDemoSession('Time limit reached');
      }
    }, this.DEMO_DURATION_LIMIT * 1000);
  }
  
  static endDemoSession(reason?: string) {
    sessionStorage.removeItem('demo_start_time');
    if (reason) {
      // Show upgrade prompt
      console.log('Demo ended:', reason);
    }
  }
  
  static isDemoSessionActive(): boolean {
    const startTime = sessionStorage.getItem('demo_start_time');
    if (!startTime) return false;
    
    const elapsed = Date.now() - parseInt(startTime);
    return elapsed < (this.DEMO_DURATION_LIMIT * 1000);
  }
}