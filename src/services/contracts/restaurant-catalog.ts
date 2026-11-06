import { z } from 'zod';

/** Public dining read model. Currently provided only by explicit mock fixtures;
 * no live endpoint is assumed or synthesized by the client. */
const photo = z.enum([
  'pasta',
  'salmon',
  'coffee',
  'burger',
  'dessert',
  'salad',
]);
export const catalogSchema = z
  .object({
    restaurantId: z.string(),
    cover: photo,
    cuisineKey: z.string(),
    dishes: z.array(
      z.object({
        id: z.string(),
        nameKey: z.string(),
        descriptionKey: z.string(),
        sectionKey: z.string(),
        photo,
        priceMinor: z.number().int().nonnegative(),
        score: z.number().min(0).max(5),
        count: z.number().int().nonnegative(),
        comments: z.array(
          z.object({
            textKey: z.string(),
            rating: z.number().int().min(1).max(5),
          }),
        ),
      }),
    ),
  })
  .strict();
export type Catalog = z.infer<typeof catalogSchema>;
export type CatalogDish = Catalog['dishes'][number];
export type FoodPhoto = Catalog['cover'];
