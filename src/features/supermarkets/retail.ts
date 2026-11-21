import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { env } from '@/lib/env';
import type { CatalogLanguage } from '@/services/contracts/restaurant-catalog';
import {
  retailCatalogSchema,
  type ProductReview,
  type RetailAttribute,
  type RetailCatalog,
  type RetailCategory,
  type RetailProduct,
} from '@/services/contracts/retail';
export type {
  Listing,
  ProductReview,
  RetailAttribute,
  RetailCatalog,
  RetailCategory,
  RetailProduct,
  Supermarket,
} from '@/services/contracts/retail';

/**
 * Repository seam. No retail backend exists yet, so non-production builds read
 * the isolated demo catalogue; production gets null and shows an honest
 * "coming soon" state. Swap this function for an API call when retail goes live.
 */
export async function readRetailCatalog(
  language: CatalogLanguage = 'az',
): Promise<RetailCatalog | null> {
  if (env.EXPO_PUBLIC_APP_ENV === 'production') return null;
  const { mockRetailCatalog } = await import('@/services/mock/retail');
  return retailCatalogSchema.parse(mockRetailCatalog(language));
}

export function useRetailCatalog() {
  const { i18n } = useTranslation();
  const language: CatalogLanguage =
    i18n.language === 'en' || i18n.language === 'ru' ? i18n.language : 'az';
  return useQuery({
    queryKey: ['retail', 'catalog', language],
    queryFn: () => readRetailCatalog(language),
    // Local demo data never changes during a session: no refetch on tab focus.
    staleTime: Infinity,
  });
}

export type ProductSummary = {
  average: number;
  count: number;
  /** Counts for 5, 4, 3, 2, 1 stars. */
  distribution: [number, number, number, number, number];
};

/** Average, count and distribution all derived from the same review list. */
export function summarize(reviews: readonly ProductReview[]): ProductSummary {
  const distribution: ProductSummary['distribution'] = [0, 0, 0, 0, 0];
  let total = 0;
  for (const r of reviews) {
    distribution[5 - r.rating]! += 1;
    total += r.rating;
  }
  const count = reviews.length;
  return {
    average: count ? Math.round((total / count) * 10) / 10 : 0,
    count,
    distribution,
  };
}

/** Mean sub-score per category-appropriate attribute, one decimal. */
export function attributeAverages(
  reviews: readonly ProductReview[],
  attributes: readonly RetailAttribute[],
) {
  return attributes.map((attribute) => {
    const values = reviews
      .map((r) => r.scores[attribute])
      .filter((v): v is number => typeof v === 'number');
    const avg = values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
    return { attribute, average: Math.round(avg * 10) / 10 };
  });
}

export type ProductSort = 'rating' | 'reviews' | 'name';
export type ShelfItem = {
  product: RetailProduct;
  summary: ProductSummary;
  priceMinor: number | null;
};

/** The store's shelf with product-level summaries (ratings span all stores). */
export function shelfFor(catalog: RetailCatalog, supermarketId: string) {
  const byProduct = new Map<string, ProductReview[]>();
  for (const r of catalog.reviews)
    byProduct.set(r.productId, [...(byProduct.get(r.productId) ?? []), r]);
  return catalog.listings
    .filter((l) => l.supermarketId === supermarketId && l.status === 'listed')
    .flatMap<ShelfItem>((l) => {
      const product = catalog.products.find((p) => p.id === l.productId);
      return product
        ? [
            {
              product,
              summary: summarize(byProduct.get(product.id) ?? []),
              priceMinor: l.priceMinor,
            },
          ]
        : [];
    });
}

/** Case-insensitive search over name, brand and category label, then sort. */
export function filterShelf(
  items: readonly ShelfItem[],
  options: {
    query: string;
    category: RetailCategory | null;
    minRating: number | null;
    sort: ProductSort;
    categoryLabel: (category: RetailCategory) => string;
    locale: string;
  },
) {
  const q = options.query.trim().toLocaleLowerCase(options.locale);
  return items
    .filter(({ product, summary }) => {
      if (options.category && product.category !== options.category)
        return false;
      if (options.minRating !== null && summary.average < options.minRating)
        return false;
      if (!q) return true;
      return [
        product.name,
        product.brand,
        options.categoryLabel(product.category),
      ].some((text) => text.toLocaleLowerCase(options.locale).includes(q));
    })
    .sort(
      (a, b) =>
        // Own-brand products lead: they are where retailers can act on feedback.
        (options.sort === 'name'
          ? 0
          : Number(b.product.privateLabel) - Number(a.product.privateLabel)) ||
        (options.sort === 'name'
          ? a.product.name.localeCompare(b.product.name, options.locale)
          : options.sort === 'reviews'
            ? b.summary.count - a.summary.count
            : b.summary.average - a.summary.average ||
              b.summary.count - a.summary.count),
    );
}
