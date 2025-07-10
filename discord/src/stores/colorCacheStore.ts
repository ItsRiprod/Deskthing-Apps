import { create } from 'zustand';

interface ColorCacheEntry {
  color: string;
  timestamp: number;
}

interface ColorCacheStore {
  cache: Map<string, ColorCacheEntry>;
  TTL: number;
  MAX_SIZE: number;
  
  // Actions
  getColor: (url: string) => string | null;
  setColor: (url: string, color: string) => void;
  clearExpired: () => void;
  clearAll: () => void;
}

export const useColorCache = create<ColorCacheStore>((set, get) => ({
  cache: new Map(),
  TTL: 24 * 60 * 60 * 1000, // 24 hours
  MAX_SIZE: 100,

  getColor: (url: string) => {
    const { cache, TTL } = get();
    const entry = cache.get(url);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > TTL) {
      // Entry expired, remove it
      set((state) => {
        const newCache = new Map(state.cache);
        newCache.delete(url);
        return { cache: newCache };
      });
      return null;
    }
    
    return entry.color;
  },

  setColor: (url: string, color: string) => {
    set((state) => {
      const newCache = new Map(state.cache);
      
      // Cleanup if cache is too large
      if (newCache.size >= state.MAX_SIZE) {
        const oldestKey = newCache.keys().next().value;
        if (oldestKey) {
          newCache.delete(oldestKey);
        }
      }
      
      newCache.set(url, { color, timestamp: Date.now() });
      return { cache: newCache };
    });
  },

  clearExpired: () => {
    set((state) => {
      const newCache = new Map(state.cache);
      const now = Date.now();
      
      for (const [url, entry] of newCache.entries()) {
        if (now - entry.timestamp > state.TTL) {
          newCache.delete(url);
        }
      }
      
      return { cache: newCache };
    });
  },

  clearAll: () => {
    set({ cache: new Map() });
  },
}));
