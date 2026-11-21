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
  ScrollView,
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
import { manualCodeSchema } from '../machine';
import {
  officialReceiptUrl,
  ReceiptImageImport,
} from '../components/ReceiptImageImport';
import { ReceiptCaptureControls } from '../components/ReceiptCaptureControls';
import {
  snapPhoto,
  takeFrame,
  toFrame,
  useReceiptCapture,
  type Frame,
} from '../hooks/useReceiptCapture';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/query';
import type { Receipt } from '@/services';

const errorKeys: Record<string, string> = {
  RECEIPT_UNSUPPORTED: 'unsupported',
  RECEIPT_ALREADY_CLAIMED: 'claimed',
  RECEIPT_EXPIRED: 'expired',
  RECEIPT_NOT_FOUND: 'notFound',
  NETWORK: 'network',
  TIMEOUT: 'network',
  RECEIPT_SOURCE_UNAVAILABLE: 'sourceUnavailable',
  RECEIPT_VERIFICATION_FAILED: 'verificationFailed',
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
  const client = useQueryClient();
  // The last scanned fiscal QR, kept so the customer can complete it with an image.
  const [lastQr, setLastQr] = useState<string | null>(null);
  const camera = useRef<CameraView>(null);
  // The photo taken the moment a fiscal QR is detected (same frame, one scan).
  const firstFrame = useRef<Promise<Frame | null> | null>(null);
  const snapping = useRef(false);
  // The customer chose to use the official receipt image instead of the camera.
  const [official, setOfficial] = useState(false);
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slide = useAnimatedValue(0);
  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }, [router]);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      void getPermission().catch(() => undefined);
      const back = BackHandler.addEventListener('hardwareBackPress', () => {
        close();
        return true;
      });
      return () => {
        setFocused(false);
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
  useEffect(() => {
    if (permission) event(permission.granted ? 'granted' : 'denied');
  }, [permission, event]);
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
    if (snapping.current) return;
    setLastQr(kind === 'qr' ? value : null);
    setOfficial(false);
    if (kind === 'qr' && officialReceiptUrl(value)) {
      // Photograph the receipt while the camera is still live; read it while the QR resolves.
      snapping.current = true;
      const shot = await snapPhoto(camera);
      snapping.current = false;
      firstFrame.current = shot ? toFrame(shot) : Promise.resolve(null);
    }
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
        router.replace({
          pathname: '/receipt/[receiptId]',
          params: { receiptId: receipt.id },
        }),
      motion.reduceMotion ? 0 : motionTokens.scanSuccessDelay,
    );
  };
  const openImported = useCallback(
    (receipt: Receipt) => {
      client.setQueryData(queryKeys.receipt.detail(receipt.id), receipt);
      void client.invalidateQueries({ queryKey: queryKeys.receipt.list });
      router.replace({
        pathname: '/receipt/[receiptId]',
        params: { receiptId: receipt.id },
      });
    },
    [client, router],
  );
  const capture = useReceiptCapture(openImported);
  // No authorised source has this fiscal receipt: read it from the camera instead.
  const sourceMissing =
    scan.state === 'error' && scan.error === 'RECEIPT_SOURCE_UNAVAILABLE';
  const capturing = sourceMissing && !official && lastQr !== null;
  const { start: startCapture, qr: captureQr } = capture;
  useEffect(() => {
    if (!capturing || captureQr || !lastQr) return;
    const pending = firstFrame.current ?? Promise.resolve(null);
    firstFrame.current = null;
    void pending.then((frame) => startCapture(lastQr, frame));
  }, [capturing, captureQr, lastQr, startCapture]);
  const stopCapture = () => {
    capture.end();
    setOfficial(false);
    event(permission?.granted ? 'retry' : 'denied');
  };
  const cameraActive = Boolean(
    permission?.granted &&
    focused &&
    active &&
    (scan.state === 'scanning' ||
      (capturing && captureQr !== null && capture.status === 'needMore')),
  );
  const manual = scan.state === 'manual-entry';
  const errorKey = errorKeys[scan.error] ?? 'unknown';
  // No authorised source returned this fiscal receipt: offer the customer-assisted import.
  const importQr = sourceMissing && official ? lastQr : null;
  const parsed = manualCodeSchema.safeParse(code);
  return (
    <>
      {!permission?.granted ? (
        <Screen
          surface="surface"
          footer={
            <Button
              variant="ghost"
              label={t('scan.manual')}
              disabled={scan.state === 'resolving' || scan.state === 'success'}
              onPress={() => event('manual')}
            />
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
              ref={camera}
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => {
                if (cameraActive && !capturing) void resolve('qr', data);
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
              {capturing ? (
                <ReceiptCaptureControls
                  status={captureQr ? capture.status : 'processing'}
                  problem={capture.problem}
                  frames={capture.frames.length}
                  onShutter={() => void takeFrame(camera).then(capture.add)}
                  onRead={capture.read}
                  onRestart={capture.restart}
                  onOfficial={() => {
                    capture.end();
                    setOfficial(true);
                  }}
                  onCancel={stopCapture}
                />
              ) : (
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
                    label={t('scan.manual')}
                    disabled={
                      scan.state === 'resolving' || scan.state === 'success'
                    }
                    onPress={() => event('manual')}
                  />
                </>
              )}
            </View>
          </SafeAreaView>
        </View>
      )}
      {scan.state === 'error' && !capturing && (
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
          {importQr ? (
            <ScrollView bounces={false}>
              <ReceiptImageImport
                qr={importQr}
                onImported={openImported}
                onScanAgain={stopCapture}
              />
            </ScrollView>
          ) : (
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
          )}
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
                value={code}
                autoFocus
                autoCapitalize="characters"
                autoCorrect={false}
                onChangeText={(value) =>
                  setCode(value.replace(/\s/g, '').toUpperCase())
                }
                maxLength={32}
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
