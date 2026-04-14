'use client';

import { useCallback, useEffect, useRef, useState } from "react";

// ─── useDebounce (value) ──────────────────────────────────────────────────────

/**
 * Delays updating a value until `delay` ms have elapsed since the last change.
 *
 * @param value  The value to debounce.
 * @param delay  Debounce window in milliseconds.
 * @returns      The debounced value (lags behind `value` by up to `delay` ms).
 *
 * @example
 * const [query, setQuery] = useState("");
 * const debouncedQuery = useDebounce(query, 300);
 * useEffect(() => fetchResults(debouncedQuery), [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ─── useDebouncedCallback ─────────────────────────────────────────────────────

export interface DebouncedCallbackOptions {
  /**
   * If `true`, the callback fires immediately on the first call of a burst
   * (leading edge). Default: `false`.
   */
  leading?: boolean;
  /**
   * If `true`, the callback fires after the debounce delay (trailing edge).
   * Default: `true`. Setting both `leading` and `trailing` to `true` fires
   * once at the start and once at the end of the burst.
   */
  trailing?: boolean;
  /**
   * Maximum wait time in ms. If set, the callback will fire at most once per
   * `maxWait` ms regardless of how often it is invoked.
   */
  maxWait?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DebouncedCallback<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  /** Fire the callback immediately, bypassing the debounce timer. */
  flush(): void;
  /** Cancel any pending invocation. */
  cancel(): void;
}

/**
 * Returns a debounced version of `callback` that only fires after `delay` ms
 * of inactivity.  The returned function is referentially stable across renders.
 *
 * @param callback  The function to debounce.
 * @param delay     Debounce window in milliseconds.
 * @param options   `leading` (default false) and `maxWait`.
 *
 * @example
 * const save = useDebouncedCallback((text: string) => api.save(text), 500);
 * <input onChange={e => save(e.target.value)} />
 */
export function useDebouncedCallback<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (...args: any[]) => any,
>(
  callback: T,
  delay: number,
  options: DebouncedCallbackOptions = {},
): DebouncedCallback<T> {
  const { leading = false, trailing = true, maxWait } = options;

  // Keep the latest callback in a ref so the debounced wrapper never goes stale.
  // Updated synchronously (not via useEffect) to avoid stale-closure issues
  // in React 19 concurrent mode, where effects may be deferred by the scheduler.
  const callbackRef = useRef<T>(callback);
  callbackRef.current = callback;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  // Tracks whether the leading edge has already fired for the current burst.
  const leadingFiredRef = useRef(false);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (maxTimerRef.current !== null) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    leadingFiredRef.current = false;
    lastArgsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (lastArgsRef.current !== null) {
      callbackRef.current(...lastArgsRef.current);
    }
    cancel();
  }, [cancel]);

  // Cancel pending timers when the component unmounts.
  useEffect(() => cancel, [cancel]);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;

      // Leading edge: fire immediately on the very first call of a burst.
      if (leading && !leadingFiredRef.current) {
        leadingFiredRef.current = true;
        callbackRef.current(...args);
      }

      // Reset the trailing-edge timer on every call.
      if (timerRef.current !== null) clearTimeout(timerRef.current);

      // Only schedule a trailing timer if trailing edge is enabled.
      // When leading=true and trailing=true: fires at both edges of the burst.
      // When leading=true and trailing=false: fires only at the leading edge.
      if (trailing) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          leadingFiredRef.current = false;
          // Skip trailing fire if leading already handled this single-call burst
          // (leading=true, trailing=true, and the value didn't change after leading fired).
          const args = lastArgsRef.current;
          lastArgsRef.current = null;
          if (args !== null) {
            callbackRef.current(...args);
          }
          // Clear maxWait timer — the burst is over.
          if (maxTimerRef.current !== null) {
            clearTimeout(maxTimerRef.current);
            maxTimerRef.current = null;
          }
        }, delay);
      } else {
        // trailing=false: burst ends when the timer would have fired; just reset state.
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          leadingFiredRef.current = false;
          lastArgsRef.current = null;
          if (maxTimerRef.current !== null) {
            clearTimeout(maxTimerRef.current);
            maxTimerRef.current = null;
          }
        }, delay);
      }

      // maxWait: guarantee at least one fire per maxWait ms during long bursts.
      if (maxWait !== undefined && maxTimerRef.current === null) {
        maxTimerRef.current = setTimeout(() => {
          maxTimerRef.current = null;
          if (lastArgsRef.current !== null) {
            callbackRef.current(...lastArgsRef.current);
            lastArgsRef.current = null;
          }
          // Reset the trailing timer so the burst continues cleanly.
          if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          leadingFiredRef.current = false;
        }, maxWait);
      }
    },
    // callbackRef and lastArgsRef are refs — intentionally excluded from deps.
    // trailing is excluded because changing it mid-burst is not a supported use-case;
    // components that need dynamic trailing should remount the hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay, leading, maxWait, cancel],
  ) as DebouncedCallback<T>;

  debounced.flush = flush;
  debounced.cancel = cancel;

  return debounced;
}
