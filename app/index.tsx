import { Redirect } from 'expo-router';

export default function Bootstrap() {
  return __DEV__ ? <Redirect href="/_design-gallery" /> : null;
}
