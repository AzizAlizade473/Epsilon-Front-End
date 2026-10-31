import type {
  GoogleSignin,
  SignInResponse,
} from '@react-native-google-signin/google-signin';
import { env } from './env';
import { registerAuthCleanup } from './auth-lifecycle';

export type GoogleSdk = {
  GoogleSignin: Pick<
    typeof GoogleSignin,
    'configure' | 'hasPlayServices' | 'signIn' | 'signOut'
  >;
  statusCodes: {
    SIGN_IN_CANCELLED: string;
    IN_PROGRESS: string;
    PLAY_SERVICES_NOT_AVAILABLE: string;
    SIGN_IN_REQUIRED: string;
  };
};
export class GoogleFlowError extends Error {
  constructor(
    readonly key:
      | 'googleFailed'
      | 'googleNetwork'
      | 'googlePlayServices'
      | 'googleNoAccount',
  ) {
    super(key);
  }
}
export function createGoogleDriver(
  load: () => Promise<GoogleSdk>,
  enabled: () => boolean,
  clientId: () => string,
) {
  let sdk: GoogleSdk | null = null;
  let pending: Promise<GoogleSdk | null> | null = null;
  async function prepare() {
    if (!enabled() || !clientId()) return null;
    pending ??= load()
      .then((module) => {
        module.GoogleSignin.configure({
          webClientId: clientId(),
          offlineAccess: false,
          scopes: ['openid', 'email', 'profile'],
        });
        sdk = module;
        return module;
      })
      .catch(() => {
        pending = null;
        throw new GoogleFlowError('googleFailed');
      });
    return pending;
  }
  return {
    prepare,
    async exchange<T>(send: (token: string) => Promise<T>): Promise<T | null> {
      const module = await prepare();
      if (!module) throw new GoogleFlowError('googleFailed');
      let response: SignInResponse;
      try {
        if (
          !(await module.GoogleSignin.hasPlayServices({
            showPlayServicesUpdateDialog: true,
          }))
        )
          throw new GoogleFlowError('googlePlayServices');
        response = await module.GoogleSignin.signIn();
      } catch (error) {
        if (error instanceof GoogleFlowError) throw error;
        const code =
          typeof error === 'object' && error && 'code' in error
            ? String(error.code)
            : '';
        if (
          code === module.statusCodes.SIGN_IN_CANCELLED ||
          code === module.statusCodes.IN_PROGRESS
        )
          return null;
        throw new GoogleFlowError(
          code === module.statusCodes.PLAY_SERVICES_NOT_AVAILABLE
            ? 'googlePlayServices'
            : code === module.statusCodes.SIGN_IN_REQUIRED ||
                code === 'NO_SAVED_CREDENTIAL_FOUND'
              ? 'googleNoAccount'
              : code === '7' || code === 'NETWORK_ERROR'
                ? 'googleNetwork'
                : 'googleFailed',
        );
      }
      if (response.type === 'cancelled') return null;
      let token = response.data.idToken;
      if (!token) throw new GoogleFlowError('googleFailed');
      try {
        return await send(token);
      } finally {
        token = null;
        response.data.idToken = null;
      }
    },
    async signOut() {
      if (sdk) await sdk.GoogleSignin.signOut();
    },
  };
}
export const googleDriver = createGoogleDriver(
  () => import('@react-native-google-signin/google-signin'),
  () => env.ENABLE_GOOGLE_SIGNIN,
  () => env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
);
export const initializeGoogle = () => googleDriver.prepare();
registerAuthCleanup(() => googleDriver.signOut());
