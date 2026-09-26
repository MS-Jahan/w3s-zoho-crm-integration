import { useEffect, useState } from 'react';

/** Returns a copy of `value` that only updates after `delay` ms of stability. */
export default function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
