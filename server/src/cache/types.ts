export interface CacheProvider {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl: number): void;
  invalidate(key: string): void;
}
