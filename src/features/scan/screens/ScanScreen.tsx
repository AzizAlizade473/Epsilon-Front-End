import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  useAnimatedValue,
} from 'react-native';
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
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { colors, motionTokens, radius, spacing, useMotion } from '@/design';
import { useToast } from '@/providers/ToastProvider';
import { Viewfinder } from '../components/Viewfinder';
import { useScanMachine } from '../hooks/useScanMachine';
import { manualCodeSchema } from '../machine';

const errorKeys: Record<string, string> = {
  RECEIPT_UNSUPPORTED: 'unsupported',
  RECEIPT_ALREADY_CLAIMED: 'claimed',
  RECEIPT_EXPIRED: 'expired',
  RECEIPT_NOT_FOUND: 'notFound',
  NETWORK: 'network',
  TIMEOUT: 'network',
};
export default function ScanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
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
  const cameraActive = Boolean(
    permission?.granted && focused && active && scan.state === 'scanning',
  );
  const manual = scan.state === 'manual-entry';
  const errorKey = errorKeys[scan.error] ?? 'unknown';
  const parsed = manualCodeSchema.safeParse(code);
  return (
    <>
      {!permission?.granted ? (
        <Screen
          title={t('scan.permissionTitle')}
          leading={
            <IconButton
              icon={X}
              accessibilityLabel={t('navigation.close')}
              onPress={close}
            />
          }
        >
          <Icon icon={Camera} size="large" decorative />
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
          <Button
            variant="ghost"
            label={t('scan.manual')}
            disabled={scan.state === 'resolving' || scan.state === 'success'}
            onPress={() => event('manual')}
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
            style={styles.controls}
            edges={['top', 'bottom']}
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
            </View>
          </SafeAreaView>
        </View>
      )}
      {scan.state === 'error' && (
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.error,
            {
              paddingBottom: Math.max(insets.bottom, spacing[20]),
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
        </Animated.View>
      )}
      <Modal
        visible={manual}
        transparent
        onRequestClose={() =>
          event(permission?.granted ? 'close-manual' : 'denied')
        }
      >
        <Sheet
          onClose={() => event(permission?.granted ? 'close-manual' : 'denied')}
          accessibilityLabel={t('scan.manual')}
        >
          <View style={styles.form}>
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
    </>
  );
}
const styles = StyleSheet.create({
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
  bottom: { padding: spacing[20], gap: spacing[16] },
  instructions: {
    color: colors.surface,
    textAlign: 'center',
    backgroundColor: colors.scanDim,
    borderRadius: radius.pill,
    padding: spacing[12],
  },
  error: {
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
