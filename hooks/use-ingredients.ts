import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "mealmind:ingredients";

export function useIngredients() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            setIngredients(JSON.parse(stored));
          } catch {
            AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (isLoaded)
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients));
  }, [ingredients, isLoaded]);

  const add = useCallback((name: string) => {
    const normalized = name.toLowerCase().trim();
    if (!normalized) return;
    setIngredients((prev) =>
      prev.includes(normalized) ? prev : [normalized, ...prev],
    );
  }, []);

  const remove = useCallback((name: string) => {
    setIngredients((prev) => prev.filter((n) => n !== name));
  }, []);

  const clear = useCallback(() => setIngredients([]), []);

  const addMultiple = useCallback((names: string[]) => {
    setIngredients((prev) => {
      const existing = new Set(prev);
      const newOnes = names
        .map((n) => n.toLowerCase().trim())
        .filter((n) => n && !existing.has(n));
      return [...newOnes, ...prev];
    });
  }, []);

  return { ingredients, add, remove, clear, addMultiple, isLoaded };
}
