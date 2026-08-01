interface TtlCacheEntry<Value> {
  value: Value;
  expiresAt: number;
}

export interface TtlCache<Key, Value> {
  get(key: Key): Value | undefined;
  set(key: Key, value: Value): void;
  delete(key: Key): void;
  clear(): void;
}

export const createTtlCache = <Key, Value>(ttlMs: number): TtlCache<Key, Value> => {
  const entries = new Map<Key, TtlCacheEntry<Value>>();

  const isExpired = (entry: TtlCacheEntry<Value>): boolean => entry.expiresAt <= Date.now();

  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (isExpired(entry)) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value) {
      entries.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
    },
    delete(key) {
      entries.delete(key);
    },
    clear() {
      entries.clear();
    },
  };
};
