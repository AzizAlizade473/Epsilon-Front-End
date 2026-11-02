import { AccessibilityInfo, findNodeHandle, View } from 'react-native';
import type { ComponentRef } from 'react';

export function focusAccessible(target: ComponentRef<typeof View> | null) {
  if (!target) return;
  const tag = findNodeHandle(target);
  if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
}
