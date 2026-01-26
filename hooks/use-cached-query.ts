import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

// In-memory cache for instant filter switching
const memCache: Record<string, unknown> = {};

export function useCachedData<T>(
  key: string,
  data: T | undefined,
): T | undefined {
  const [cached, setCached] = useState<T | undefined>(
    () => memCache[key] as T | undefined,
  );

  // Load from disk on mount or key change (only if no memCache)
  useEffect(() => {
    if (!memCache[key]) {
      AsyncStorage.getItem(key).then((v) => {
        if (v) {
          const parsed = JSON.parse(v);
          memCache[key] = parsed;
          setCached(parsed);
        }
      });
    } else {
      // Sync state with memCache when key changes
      setCached(memCache[key] as T | undefined);
    }
  }, [key]);

  const hasData = Array.isArray(data) ? data.length > 0 : !!data;

  // Update cache and state when fresh data arrives
  useEffect(() => {
    if (hasData) {
      setCached(data);
      memCache[key] = data;
      AsyncStorage.setItem(key, JSON.stringify(data));
    }
  }, [key, data, hasData]);

  return cached;
}
