import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  AppState,
  BackHandler,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import X from 'lucide-react-native/icons/x';
import Zap from 'lucide-react-native/icons/zap';
import Camera from 'lucide-react-native/icons/camera';
import {
  AndroidHaptics,
  NotificationFeedbackType,
  notificationAsync,
  performAndroidHapticsAsync,
} from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ScanPreview } from '../components/ScanPreview';
import { AuthHeading } from '@/components/ui/AuthHeading';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { colors, motionTokens, radius, spacing, useMotion } from '@/design';
import { useToast } from '@/providers/ToastProvider';
import { Viewfinder } from '../components/Viewfinder';
import { useScanMachine } from '../hooks/useScanMachine';
import { manualCodeSchema, typedFiscalUrl } from '../machine';
import { officialReceiptUrl } from '../ekassa/exportBridge';
import { pickQrFromImage } from '../imageQr';

const errorKeys: Record<string, string> = {
  RECEIPT_UNSUPPORTED: 'unsupported',
  RECEIPT_ALREADY_CLAIMED: 'claimed',
  RECEIPT_EXPIRED: 'expired',
  RECEIPT_NOT_FOUND: 'notFound',
  NETWORK: 'network',
  TIMEOUT: 'network',
  RECEIPT_SOURCE_UNAVAILABLE: 'sourceUnavailable',
  RECEIPT_VERIFICATION_FAILED: 'verificationFailed',
  IMAGE_NO_QR: 'imageNone',
  IMAGE_MULTIPLE_QR: 'imageMultiple',
  IMAGE_UNREADABLE: 'imageUnreadable',
};
export default function ScanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const bottomInset = tabBarHeight
    ? tabBarHeight + spacing[16]
    : Math.max(insets.bottom, spacing[20]);
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const scan = useScanMachine();
  const { cancel, event } = scan;
  const motion = useMotion();
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(
    AppState.currentState !== 'background' &&
      AppState.currentState !== 'inactive',
  );
  const [torch, setTorch] = useState(false);
  const [code, setCode] = useState('');
  // The last scanned fiscal QR: opened on the official e-kassa page when no partner has it.
  const [lastQr, setLastQr] = useState<string | null>(null);
  const [notFiscal, setNotFiscal] = useState(false);
  const [typed, setTyped] = useState(false);
  const [picking, setPicking] = useState(false);
  const focusedRef = useRef(false);
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slide = useAnimatedValue(0);
  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }, [router]);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      focusedRef.current = true;
      void getPermission().catch(() => undefined);
      const back = BackHandler.addEventListener('hardwareBackPress', () => {
        close();
        return true;
      });
      return () => {
        setFocused(false);
        focusedRef.current = false;
        cancel();
        back.remove();
        if (navigateTimer.current) clearTimeout(navigateTimer.current);
      };
    }, [getPermission, close, cancel]),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setActive(state === 'active');
      if (state === 'active') void getPermission().catch(() => undefined);
      else {
        cancel();
        setTorch(false);
        if (navigateTimer.current) clearTimeout(navigateTimer.current);
      }
    });
    return () => subscription.remove();
  }, [getPermission, cancel]);
  // Only a changed answer counts: the refresh after the photo picker closes must
  // not reset a check that is already running.
  const granted = permission?.granted;
  useEffect(() => {
    if (granted !== undefined) event(granted ? 'granted' : 'denied');
  }, [granted, event]);
  useEffect(() => {
    if (scan.state !== 'error') return;
    slide.setValue(motion.reduceMotion ? 1 : 0);
    const animation = Animated.timing(slide, {
      toValue: 1,
      duration: motion.reduceMotion ? 0 : motionTokens.scanErrorDuration,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [scan.state, slide, motion.reduceMotion]);
  const resolve = async (kind: 'qr' | 'code', value: string) => {
    const official =
      kind === 'qr' ? officialReceiptUrl(value) : typedFiscalUrl(value);
    setLastQr(official);
    setNotFiscal(kind === 'qr' && !official);
    setTyped(kind === 'code');
    const receipt = await scan.resolve(kind, value);
    if (!receipt) return;
    setCode('');
    setTorch(false);
    const haptic =
      Platform.OS === 'android'
        ? performAndroidHapticsAsync(AndroidHaptics.Confirm)
        : notificationAsync(NotificationFeedbackType.Success);
    void haptic.catch(() => undefined);
    navigateTimer.current = setTimeout(
      () =>
        // Push, never replace: replacing from a tab removes the tabs under it.
        router.push({
          pathname: '/receipt/[receiptId]',
          params: { receiptId: receipt.id },
        }),
      motion.reduceMotion ? 0 : motionTokens.scanSuccessDelay,
    );
  };
  const upload = async () => {
    if (picking) return;
    setPicking(true);
    const result = await pickQrFromImage();
    setPicking(false);
    // The customer may have left the screen while the image was being read.
    if (!result || !focusedRef.current) return;
    if ('error' in result) scan.fail(result.error);
    else await resolve('qr', result.data);
  };
  // No partner source has this fiscal receipt: open the official e-kassa page for it.
  const sourceMissing =
    scan.state === 'error' &&
    scan.error === 'RECEIPT_SOURCE_UNAVAILABLE' &&
    lastQr !== null;
  useEffect(() => {
    if (!sourceMissing || !lastQr) return;
    // Back to scanning first, so returning from the official page shows a live camera.
    event('retry');
    router.push({ pathname: '/receipt-import', params: { qr: lastQr } });
  }, [sourceMissing, lastQr, event, router]);
  const cameraActive = Boolean(
    permission?.granted &&
    focused &&
    active &&
    !picking &&
    scan.state === 'scanning',
  );
  const busy = scan.state === 'resolving' || scan.state === 'success';
  const manual = scan.state === 'manual-entry';
  // "Check the code and try again" is no help for a scanned non-fiscal QR.
  const errorKey =
    notFiscal && scan.error === 'RECEIPT_NOT_FOUND'
      ? 'unsupported'
      : typed && scan.error === 'RECEIPT_UNSUPPORTED'
        ? 'manualUnsupported'
        : (errorKeys[scan.error] ?? 'unknown');
  const parsed = manualCodeSchema.safeParse(code);
  return (
    <>
      {!permission?.granted ? (
        <Screen
          surface="surface"
          footer={
            <>
              <Button
                variant="ghost"
                label={t('scan.upload')}
                loading={picking}
                disabled={busy}
                onPress={() => void upload()}
              />
              <Button
                variant="ghost"
                label={t('scan.manual')}
                disabled={busy}
                onPress={() => event('manual')}
              />
            </>
          }
          leading={
            <IconButton
              icon={X}
              accessibilityLabel={t('navigation.close')}
              onPress={close}
            />
          }
        >
          <View style={styles.permissionArt}>
            <ScanPreview />
          </View>
          <Text variant="title1" accessibilityRole="header">
            {t('scan.permissionTitle')}
          </Text>
          <Text accessibilityLiveRegion="polite">
            {t(
              scan.state === 'resolving'
                ? 'scan.resolving'
                : scan.state === 'success'
                  ? 'scan.resolved'
                  : 'scan.permissionBody',
            )}
          </Text>
          <Button
            label={t(
              permission?.status === 'denied' ? 'scan.settings' : 'scan.allow',
            )}
            onPress={() => {
              const action =
                permission?.status === 'denied'
                  ? Linking.openSettings()
                  : requestPermission();
              void action.catch(() => toast(t('errors.generic')));
            }}
            disabled={
              !permission ||
              scan.state === 'resolving' ||
              scan.state === 'success'
            }
          />
        </Screen>
      ) : (
        <View style={styles.root}>
          <StatusBar style="light" />
          {cameraActive && (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => {
                if (cameraActive) void resolve('qr', data);
              }}
              onMountError={() => {
                event('detect');
                event('failed');
              }}
            />
          )}
          <Viewfinder
            scanning={cameraActive}
            success={scan.state === 'success'}
          />
          <SafeAreaView
            style={[styles.controls, { paddingBottom: bottomInset }]}
            edges={['top', 'left', 'right']}
            pointerEvents="box-none"
          >
            <View style={styles.header}>
              <IconButton
                icon={X}
                tone="inverse"
                accessibilityLabel={t('navigation.close')}
                onPress={close}
              />
              <Text variant="headline" style={styles.inverse}>
                {t('home.scan')}
              </Text>
              <IconButton
                icon={Zap}
                tone="inverse"
                disabled={!cameraActive}
                accessibilityLabel={t(torch ? 'scan.torchOff' : 'scan.torchOn')}
                onPress={() => setTorch((value) => !value)}
              />
            </View>
            <View style={styles.bottom}>
              <>
                <Text
                  style={styles.instructions}
                  accessibilityLiveRegion="polite"
                >
                  {t(
                    scan.state === 'resolving'
                      ? 'scan.resolving'
                      : scan.state === 'success'
                        ? 'scan.resolved'
                        : 'scan.position',
                  )}
                </Text>
                <Button
                  variant="secondary"
                  label={t('scan.upload')}
                  loading={picking}
                  disabled={busy}
                  onPress={() => void upload()}
                />
                <Button
                  variant="secondary"
                  label={t('scan.manual')}
                  disabled={busy}
                  onPress={() => event('manual')}
                />
              </>
            </View>
          </SafeAreaView>
        </View>
      )}
      {scan.state === 'error' && !sourceMissing && (
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.error,
            {
              paddingBottom: bottomInset,
              opacity: slide,
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [spacing[24], 0],
                  }),
                },
              ],
            },
          ]}
        >
          <>
            <Text variant="title2" accessibilityRole="alert">
              {t(`scan.errors.${errorKey}.title`)}
            </Text>
            <Text>{t(`scan.errors.${errorKey}.body`)}</Text>
            <Button
              label={t('scan.retry')}
              onPress={() => event(permission?.granted ? 'retry' : 'denied')}
            />
            <Button
              variant="ghost"
              label={t('navigation.close')}
              onPress={close}
            />
          </>
        </Animated.View>
      )}
      {manual && (
        <Modal
          visible={manual}
          transparent
          onRequestClose={() =>
            event(permission?.granted ? 'close-manual' : 'denied')
          }
        >
          <Sheet
            onClose={() =>
              event(permission?.granted ? 'close-manual' : 'denied')
            }
            accessibilityLabel={t('scan.manual')}
          >
            <View style={styles.form}>
              <AuthHeading
                icon={Camera}
                title={t('scan.manual')}
                message={t('visual.manualHint')}
              />
              <Input
                label={t('scan.code')}
                hint={t('scan.codeHint')}
                error={code.length > 44 ? t('scan.codeTooLong') : undefined}
                value={code}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                onChangeText={(value) => setCode(value.replace(/\s/g, ''))}
                // Above the limit, so a longer paste is reported and never cut silently.
                maxLength={64}
              />
              <Button
                label={t('common.continue')}
                disabled={!parsed.success}
                onPress={() => {
                  if (parsed.success) void resolve('code', parsed.data);
                }}
              />
            </View>
          </Sheet>
        </Modal>
      )}
    </>
  );
}
const styles = StyleSheet.create({
  permissionArt: {
    backgroundColor: colors.brand.tint,
    borderRadius: radius[24],
  },
  root: { flex: 1, backgroundColor: colors.cameraBackground },
  controls: { flex: 1, justifyContent: 'space-between' },
  header: {
    padding: spacing[16],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[8],
  },
  inverse: { color: colors.surface, flexShrink: 1, textAlign: 'center' },
  bottom: { padding: spacing[24], gap: spacing[20] },
  instructions: {
    color: colors.surface,
    textAlign: 'center',
    backgroundColor: colors.scanDim,
    borderRadius: radius[16],
    padding: spacing[12],
  },
  error: {
    maxHeight: '88%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius[20],
    borderTopRightRadius: radius[20],
    padding: spacing[20],
    gap: spacing[12],
  },
  form: { gap: spacing[16] },
});
