import { useEffect, useState } from 'react';

/** Trimmed input, updated 300 ms after typing stops. */
export function useDebouncedSearch(value: string) {
  const [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(value.trim()), 300);
    return () => clearTimeout(timer);
  }, [value]);
  // Clearing is immediate; changing a query never retains the previous results.
  return value.trim() === '' ? '' : search;
}
