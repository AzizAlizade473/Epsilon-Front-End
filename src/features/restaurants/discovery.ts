/** Category filters built only from what the directory really holds. */
import type { DirectoryEntry } from '@/services/contracts/restaurant-catalog';

export const filterGroups = [
  'cuisine',
  'district',
  'price',
  'ingredient',
] as const;
export type FilterGroup = (typeof filterGroups)[number];
export type Filters = Record<FilterGroup, readonly string[]>;
export const noFilters: Filters = {
  cuisine: [],
  district: [],
  price: [],
  ingredient: [],
};

function values(entry: DirectoryEntry, group: FilterGroup): string[] {
  if (group === 'cuisine') return [entry.cuisine];
  if (group === 'district') return [entry.district];
  if (group === 'price') return [String(entry.priceLevel)];
  return entry.ingredients ?? [];
}

export const activeCount = (filters: Filters) =>
  filterGroups.reduce((total, group) => total + filters[group].length, 0);

/** Any choice within a group; every group with a choice must match. */
export function matches(
  entry: DirectoryEntry | undefined,
  filters: Filters,
): boolean {
  return filterGroups.every(
    (group) =>
      !filters[group].length ||
      (entry !== undefined &&
        values(entry, group).some((v) => filters[group].includes(v))),
  );
}

export function toggle(
  filters: Filters,
  group: FilterGroup,
  value: string,
): Filters {
  const chosen = filters[group];
  return {
    ...filters,
    [group]: chosen.includes(value)
      ? chosen.filter((v) => v !== value)
      : [...chosen, value],
  };
}

/**
 * Options per group with the number of restaurants each would show given the
 * other groups. Empty options are left out unless already chosen.
 */
export function facets(entries: readonly DirectoryEntry[], filters: Filters) {
  return filterGroups.map((group) => {
    const counts = new Map<string, number>(filters[group].map((v) => [v, 0]));
    const others = { ...filters, [group]: [] };
    for (const entry of entries)
      if (matches(entry, others))
        for (const value of new Set(values(entry, group)))
          counts.set(value, (counts.get(value) ?? 0) + 1);
    const options = [...counts].map(([value, count]) => ({ value, count }));
    options.sort((a, b) =>
      group === 'price'
        ? Number(a.value) - Number(b.value)
        : b.count - a.count || a.value.localeCompare(b.value),
    );
    return { group, options };
  });
}

/** The cuisines with the most restaurants. */
export function topCuisines(entries: readonly DirectoryEntry[], limit = 4) {
  return facets(entries, noFilters)[0]!
    .options.slice(0, limit)
    .map((option) => option.value as DirectoryEntry['cuisine']);
}
