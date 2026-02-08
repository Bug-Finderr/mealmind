import { useCallback, useRef, useState } from "react";

export function useHistory<T>(initial: T) {
  const [present, setPresent] = useState(initial);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((v) => v + 1), []);

  const set = useCallback((updater: T | ((prev: T) => T)) => {
    setPresent(updater);
  }, []);

  const snapshot = useCallback(() => {
    setPresent((current) => {
      pastRef.current = [...pastRef.current, current];
      futureRef.current = [];
      bump();
      return current;
    });
  }, [bump]);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    setPresent((current) => {
      const previous = pastRef.current[pastRef.current.length - 1];
      pastRef.current = pastRef.current.slice(0, -1);
      futureRef.current = [current, ...futureRef.current];
      bump();
      return previous;
    });
  }, [bump]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    setPresent((current) => {
      const next = futureRef.current[0];
      futureRef.current = futureRef.current.slice(1);
      pastRef.current = [...pastRef.current, current];
      bump();
      return next;
    });
  }, [bump]);

  const reset = useCallback(
    (state: T) => {
      set(state);
      pastRef.current = [];
      futureRef.current = [];
      bump();
    },
    [set, bump],
  );

  return {
    state: present,
    set,
    snapshot,
    undo,
    redo,
    reset,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
