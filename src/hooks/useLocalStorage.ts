"use client";

import { useState, useCallback, useSyncExternalStore } from "react";

function readStoredValue<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue;
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      if (parsed && typeof parsed === "object") {
        return parsed as T;
      }
      window.localStorage.removeItem(key);
    }
  } catch {
    window.localStorage.removeItem(key);
  }
  return initialValue;
}

const emptySubscribe = () => () => {};
const getHydratedSnapshot = () => true;
const getHydratedServerSnapshot = () => false;

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(() =>
    readStoredValue(key, initialValue)
  );
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    getHydratedSnapshot,
    getHydratedServerSnapshot
  );

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
        } catch {
          // storage full or unavailable
        }
        return nextValue;
      });
    },
    [key]
  );

  return [storedValue, setValue, hydrated];
}
