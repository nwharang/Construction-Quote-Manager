import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to persist state in localStorage
 * @param key - The localStorage key
 * @param initialValue - The initial value to use if no value exists in localStorage
 * @returns A tuple containing the current value and a setter function
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const isInitialized = useRef(false);
  const lastUpdate = useRef<number>(0);

  // Initialize the state on first render
  useEffect(() => {
    if (isInitialized.current) return;
    
    try {
      if (typeof window === 'undefined') {
        return;
      }
      
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Parse stored json or return initialValue if none
      if (item) {
        setStoredValue(JSON.parse(item));
      }
      
      isInitialized.current = true;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  }, [key]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      
      // Throttle updates to prevent rapid consecutive calls
      const now = Date.now();
      if (now - lastUpdate.current < 100) {
        return;
      }
      lastUpdate.current = now;
      
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Don't update if the value hasn't changed
      if (JSON.stringify(valueToStore) === JSON.stringify(storedValue)) {
        return;
      }
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue];
} 