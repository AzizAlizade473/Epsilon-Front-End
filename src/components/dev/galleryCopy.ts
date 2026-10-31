import az from '../../../locales/az.json';
import en from '../../../locales/en.json';
import ru from '../../../locales/ru.json';

export type GalleryLanguage = 'az' | 'en' | 'ru';
export type GalleryCopy = typeof az.gallery;
export const galleryCopy: Record<GalleryLanguage, GalleryCopy> = {
  az: az.gallery,
  en: en.gallery,
  ru: ru.gallery,
};
