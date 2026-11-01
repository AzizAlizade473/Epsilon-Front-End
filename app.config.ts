import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Epsilon',
  slug: 'epsilon',
  version: '0.1.0',
  icon: './assets/brand/app-icon-flat.png',
  scheme: 'epsilon',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  experiments: { typedRoutes: true },
  extra: {
    ...config.extra,
    epsilonFlags: {
      google: process.env.ENABLE_GOOGLE_SIGNIN === 'true',
      apple: false,
      crashDevelopment: process.env.ENABLE_CRASH_REPORTING_DEV === 'true',
    },
  },
  android: {
    package: process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'com.epsilonup.app',
    adaptiveIcon: {
      foregroundImage: './assets/brand/app-icon.png',
      backgroundColor: '#FFFFFF',
      monochromeImage: './assets/brand/app-icon-monochrome.png',
    },
    softwareKeyboardLayoutMode: 'resize',
    allowBackup: false,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.POST_NOTIFICATIONS',
    ],
    blockedPermissions: [
      'android.permission.VIBRATE',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.GET_ACCOUNTS',
      'android.permission.READ_CONTACTS',
      'android.permission.READ_SMS',
      'android.permission.RECEIVE_SMS',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.RECEIVE_BOOT_COMPLETED',
    ],
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  plugins: [
    [
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        useNativeInit: false,
        disableAutoUpload: !(
          (process.env.EAS_BUILD === 'true' || process.env.CI === 'true') &&
          process.env.SENTRY_AUTH_TOKEN
        ),
      },
    ],
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
    ['expo-notifications', { defaultChannel: 'cashback-updates' }],
    'expo-localization',
    [
      'expo-splash-screen',
      {
        image: './assets/brand/app-icon.png',
        imageWidth: 120,
        backgroundColor: '#FFFFFF',
      },
    ],
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
