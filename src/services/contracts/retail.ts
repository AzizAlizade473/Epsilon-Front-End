import { z } from 'zod';

/**
 * Retail (supermarket) read model. Today it is served only by the isolated demo
 * repository; no retail endpoint exists yet. Text arrives localized, as a live
 * API would via Accept-Language. Ratings belong to products, never to stores.
 */
export const retailCategorySchema = z.enum([
  'dairy',
  'yogurt',
  'bakery',
  'beverages',
  'snacks',
  'produce',
  'meat',
  'pantry',
  'household',
]);
/** Category-appropriate criteria: food never asks about effectiveness, cleaners never about taste. */
export const retailAttributeSchema = z.enum([
  'quality',
  'taste',
  'texture',
  'freshness',
  'effectiveness',
  'value',
  'packaging',
]);
/** Original packaging illustration shapes (no photos, no third-party artwork). */
export const packShapeSchema = z.enum([
  'cup',
  'carton',
  'bottle',
  'loaf',
  'bag',
  'bar',
  'jar',
  'box',
  'tray',
]);

const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

/** Where a real-world fact (name, size, listing) was checked. Never invented. */
export const sourceSchema = z
  .object({
    url: z.string().url().startsWith('https://'),
    type: z.enum(['official-site', 'wolt-listing', 'promo-catalog']),
    checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

export const productSchema = z
  .object({
    id,
    /** Optional EAN/SKU; demo values are not real barcodes. */
    barcode: z.string().nullable(),
    brand: z.string().min(1),
    name: z.string().min(1),
    variant: z.string().min(1).nullable(),
    category: retailCategorySchema,
    size: z.string().min(1),
    imageUrl: z.string().url().startsWith('https://').nullable(),
    privateLabel: z.boolean(),
    sources: z.array(sourceSchema),
    attributes: z.array(retailAttributeSchema).min(1).max(5),
    art: z.object({ shape: packShapeSchema, color, accent: color }).strict(),
  })
  .strict();

export const supermarketSchema = z
  .object({
    id,
    name: z.string().min(1),
    description: z.string().min(1),
    color,
    /** True for every chain until a real retail partnership exists. */
    demo: z.boolean(),
    coverUrl: z.string().url().startsWith('https://').nullable(),
    logoUrl: z.string().url().startsWith('https://').nullable(),
    logoOnDark: z.boolean(),
    /** Own brands confirmed on the chain's official site. */
    privateLabels: z.array(z.string().min(1)),
    sources: z.array(sourceSchema),
  })
  .strict();

export const listingSchema = z
  .object({
    supermarketId: id,
    productId: id,
    status: z.enum(['listed', 'unavailable']),
    /** Sample shelf price in qəpik; shown only with a "sample" label. */
    priceMinor: z.number().int().nonnegative().nullable(),
  })
  .strict();

export const productReviewSchema = z
  .object({
    id,
    productId: id,
    supermarketId: id,
    rating: z.number().int().min(1).max(5),
    scores: z.partialRecord(
      retailAttributeSchema,
      z.number().int().min(1).max(5),
    ),
    comment: z.string().min(1).max(600),
    createdAt: z.string().datetime(),
    author: z.string().min(1).max(32),
    /** 'sample' = demo content; 'verified' requires a verified receipt item. */
    verification: z.enum(['sample', 'verified']),
    receiptItemId: id.nullable(),
  })
  .strict();

export const retailCatalogSchema = z
  .object({
    supermarkets: z.array(supermarketSchema),
    products: z.array(productSchema),
    listings: z.array(listingSchema),
    reviews: z.array(productReviewSchema),
  })
  .strict();

export type RetailCategory = z.infer<typeof retailCategorySchema>;
export type RetailAttribute = z.infer<typeof retailAttributeSchema>;
export type PackShape = z.infer<typeof packShapeSchema>;
export type RetailProduct = z.infer<typeof productSchema>;
export type Supermarket = z.infer<typeof supermarketSchema>;
export type Listing = z.infer<typeof listingSchema>;
export type ProductReview = z.infer<typeof productReviewSchema>;
export type RetailCatalog = z.infer<typeof retailCatalogSchema>;

/**
 * Future retail purchase records (no endpoint yet). One visit carries many
 * line items; each item is rated on its own, never the visit as a whole.
 */
export type RetailReceiptLineItem = {
  id: string;
  receiptId: string;
  productId: string;
  quantity: number;
  canRate: boolean;
  rating: number | null;
};
export type RetailReceipt = {
  id: string;
  supermarketId: string;
  branchId: string | null;
  purchasedAt: string;
  status: 'pending' | 'verified' | 'rejected';
  items: RetailReceiptLineItem[];
};
