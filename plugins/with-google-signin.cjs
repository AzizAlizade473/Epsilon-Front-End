const { withAndroidManifest } = require('expo/config-plugins');

/** Android original SDK autolinks without Firebase; expose only Play Services. */
module.exports = (config, { enabled, webClientId }) => {
  if (!enabled) return config;
  if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(webClientId ?? '')) {
    throw new Error('Google sign-in requires a valid public web client ID');
  }
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    manifest.queries ??= [];
    const exists = manifest.queries.some((query) =>
      query.package?.some(
        (entry) => entry.$['android:name'] === 'com.google.android.gms',
      ),
    );
    if (!exists)
      manifest.queries.push({
        package: [{ $: { 'android:name': 'com.google.android.gms' } }],
      });
    return mod;
  });
};
