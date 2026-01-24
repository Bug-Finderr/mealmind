import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";

// In-memory cache for instant filter switching
const memCache: Record<string, unknown> = {};

export function useCachedData<T>(
  key: string,
  data: T | undefined,
): T | undefined {
  const [diskCache, setDiskCache] = useState<T | undefined>(
    () => memCache[key] as T | undefined,
  );
  const prevKey = useRef(key);

  // Load from disk when key changes
  useEffect(() => {
    if (prevKey.current !== key || !memCache[key]) {
      prevKey.current = key;
      AsyncStorage.getItem(key).then((v) => {
        if (v) {
          const parsed = JSON.parse(v);
          memCache[key] = parsed;
          setDiskCache(parsed);
        }
      });
    }
  }, [key]);

  const hasData = Array.isArray(data) ? data.length > 0 : !!data;

  // Save when we have real data
  useEffect(() => {
    if (hasData) {
      memCache[key] = data;
      AsyncStorage.setItem(key, JSON.stringify(data));
    }
  }, [key, data, hasData]);

  // Fresh data if available, otherwise cached
  return hasData ? data : ((memCache[key] as T | undefined) ?? diskCache);
}
