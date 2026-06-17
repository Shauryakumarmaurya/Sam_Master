'use client';

/**
 * localStorage helpers with JSON serialization and error handling.
 * Handles SSR gracefully (localStorage doesn't exist on the server).
 */

export function loadState(key, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[storage] Failed to load "${key}":`, err);
    return fallback;
  }
}

export function saveState(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[storage] Failed to save "${key}":`, err);
  }
}

export function removeState(key) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[storage] Failed to remove "${key}":`, err);
  }
}
