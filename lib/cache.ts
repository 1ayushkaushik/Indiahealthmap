type CacheData = {
  value: any;
  expiry: number;
};

class Cache {
  private cache: Map<string, CacheData>;

  constructor() {
    this.cache = new Map();
  }

  async get(key: string): Promise<any | null> {
    const data = this.cache.get(key);
    if (!data) return null;

    if (Date.now() > data.expiry) {
      this.cache.delete(key);
      return null;
    }

    return data.value;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

export const cache = new Cache(); 