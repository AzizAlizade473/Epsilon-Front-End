/** Receipt lines end with the VAT marker ("Pendirli sous * 18%"): not part of the dish name. */
export const dishName = (name: string) =>
  name.replace(/\s*\*\s*(\d{1,2}\s*%)?\s*$/u, '').trim() || name;
