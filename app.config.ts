import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Epsilon',
  slug: 'epsilon',
  version: '0.1.0',
  scheme: 'epsilon',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  experiments: { typedRoutes: true },
  extra: {
    ...config.extra,
    epsilonFlags: {
      google: process.env.ENABLE_GOOGLE_SIGNIN === 'true',
      apple: false,
    },
  },
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
    blockedPermissions: [
      'android.permission.VIBRATE',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.GET_ACCOUNTS',
      'android.permission.READ_CONTACTS',
      'android.permission.READ_SMS',
      'android.permission.RECEIVE_SMS',
    ],
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  plugins: [
    [
      './plugins/with-google-signin.cjs',
      {
        enabled: process.env.ENABLE_GOOGLE_SIGNIN === 'true',
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
      },
    ],
    'expo-router',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow Epsilon to scan receipt QR codes.',
        recordAudioAndroid: false,
      },
    ],
    'expo-secure-store',
    'expo-web-browser',
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
