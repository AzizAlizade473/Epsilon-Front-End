import { Redirect } from 'expo-router';
import { lazy, Suspense } from 'react';

// Keep sample copy/data and primitive imports outside the production graph.
const Gallery = __DEV__
  ? lazy(() =>
      import('@/components/dev/DesignGallery').then(({ DesignGallery }) => ({
        default: DesignGallery,
      })),
    )
  : null;

export default function DesignGalleryRoute() {
  return Gallery ? (
    <Suspense fallback={null}>
      <Gallery />
    </Suspense>
  ) : (
    <Redirect href="/" />
  );
}
