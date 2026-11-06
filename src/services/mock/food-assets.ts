import type { FoodPhoto } from '@/services/contracts/restaurant-catalog';
export const foodAssets: Record<FoodPhoto, number> = {
  pasta: require('../../../assets/food/pasta.jpg'),
  salmon: require('../../../assets/food/salmon.jpg'),
  burger: require('../../../assets/food/burger.jpg'),
  coffee: require('../../../assets/food/coffee.jpg'),
  dessert: require('../../../assets/food/dessert.jpg'),
  salad: require('../../../assets/food/salad.jpg'),
};
