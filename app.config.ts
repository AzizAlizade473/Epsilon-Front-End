import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Epsilon',
  slug: 'epsilon',
  version: '0.1.0',
  scheme: 'epsilon',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  android: {
    package: process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'com.epsilonup.app',
    adaptiveIcon: {
      foregroundImage: './assets/brand/app-icon.png',
      backgroundColor: '#FFFFFF',
      monochromeImage: './assets/brand/app-icon.png',
    },
    softwareKeyboardLayoutMode: 'resize',
    allowBackup: false,
    permissions: ['android.permission.CAMERA'],
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  plugins: [
    'expo-router',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow Epsilon to scan receipt QR codes.',
        recordAudioAndroid: false,
      },
    ],
    'expo-secure-store',
    'expo-localization',
    'expo-splash-screen',
    [
      'expo-build-properties',
      {
        android: {
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          usesCleartextTraffic: false,
        },
      },
    ],
  ],
});
