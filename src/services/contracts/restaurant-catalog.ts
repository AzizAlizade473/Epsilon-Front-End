import { z } from 'zod';

/**
 * Public dining read model: partner directory, menus, dish ratings and reviews.
 * Currently provided only by explicit development mock fixtures; no live
 * endpoint is assumed or synthesized by the client. Text fields arrive already
 * localized (as a live API would via Accept-Language). Read-only by design:
 * rating stays tied to verified purchases through the receipt flow.
 */
export const cuisineSchema = z.enum([
  'azerbaijani',
  'italian',
  'japanese',
  'georgian',
  'turkish',
  'steakhouse',
  'seafood',
  'cafe',
  'asian',
  'mediterranean',
  'burger',
  'french',
  'indian',
  'levantine',
]);
export const ingredientSchema = z.enum([
  'beef',
  'lamb',
  'chicken',
  'fish',
  'shrimp',
  'rice',
  'pasta',
  'dough',
  'cheese',
  'egg',
  'vegetables',
  'herbs',
  'mushroom',
  'tomato',
  'sauce',
  'spice',
  'fruit',
  'chocolate',
  'coffee',
  'citrus',
  'nuts',
  'yogurt',
  'potato',
  'bread',
]);
export const allergenSchema = z.enum([
  'gluten',
  'dairy',
  'egg',
  'nuts',
  'fish',
  'shellfish',
  'soy',
  'sesame',
]);
export const aspectSchema = z.enum([
  'taste',
  'portion',
  'temperature',
  'presentation',
  'value',
]);

const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
const imageUrl = z.string().url().startsWith('https://');
const count = z.number().int().nonnegative();
const average = z.number().min(0).max(5);

export const ratingSummarySchema = z
  .object({
    average,
    /** Verified ratings (stars), not only written reviews. */
    count,
    /** Written reviews with a comment. */
    reviewCount: count,
    /** Counts for 5★, 4★, 3★, 2★, 1★ in that order; sums to `count`. */
    distribution: z.tuple([count, count, count, count, count]),
  })
  .strict();

export const reviewSchema = z
  .object({
    id,
    rating: z.number().int().min(1).max(5),
    createdAt: z.string().datetime(),
    /** Already masked by the server (for example "A*** M."). */
    author: z.string().min(1).max(32),
    comment: z.string().min(1).max(600),
    aspects: z.array(aspectSchema).max(5),
  })
  .strict();

export const dishSchema = z
  .object({
    id,
    categoryId: id,
    name: z.string().min(1),
    description: z.string().min(1),
    imageUrl,
    /** Menu price in qəpik, or null when no verified price is available. */
    priceMinor: count.nullable(),
    portionGrams: z.number().int().positive().nullable(),
    prepMinutes: z.number().int().positive(),
    spicy: z.boolean(),
    rating: ratingSummarySchema,
    /** Monthly averages, oldest first, months as YYYY-MM. */
    trend: z
      .array(
        z
          .object({ month: z.string().regex(/^\d{4}-\d{2}$/), average })
          .strict(),
      )
      .max(12),
    preview: reviewSchema.nullable(),
    ingredients: z.array(ingredientSchema).max(6),
    allergens: z.array(allergenSchema),
    pairingIds: z.array(id).max(6),
  })
  .strict();

export const catalogSchema = z
  .object({
    restaurantId: id,
    cuisine: cuisineSchema,
    coverUrl: imageUrl,
    about: z.string().min(1),
    district: z.string().min(1),
    priceLevel: z.number().int().min(1).max(4),
    rating: ratingSummarySchema,
    categories: z.array(z.object({ id, name: z.string().min(1) }).strict()),
    dishes: z.array(dishSchema),
  })
  .strict();

export const directoryEntrySchema = z
  .object({
    restaurantId: id,
    cuisine: cuisineSchema,
    coverUrl: imageUrl,
    district: z.string().min(1),
    priceLevel: z.number().int().min(1).max(4),
    rating: ratingSummarySchema,
    dishCount: count,
    /** Best-rated dish name, shown as the restaurant's signature. */
    signature: z.string().min(1),
    /** Main ingredients across the menu's dishes. */
    ingredients: z.array(ingredientSchema).optional(),
  })
  .strict();
export const directorySchema = z.array(directoryEntrySchema);
export const reviewListSchema = z.array(reviewSchema);

export type Cuisine = z.infer<typeof cuisineSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type Allergen = z.infer<typeof allergenSchema>;
export type Aspect = z.infer<typeof aspectSchema>;
export type RatingSummary = z.infer<typeof ratingSummarySchema>;
export type Review = z.infer<typeof reviewSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type CatalogDish = z.infer<typeof dishSchema>;
export type DirectoryEntry = z.infer<typeof directoryEntrySchema>;
export type CatalogLanguage = 'az' | 'en' | 'ru';
/** Bundled development stock photos (still used by Home's dish cards). */
export type FoodPhoto =
  'pasta' | 'salmon' | 'coffee' | 'burger' | 'dessert' | 'salad';
