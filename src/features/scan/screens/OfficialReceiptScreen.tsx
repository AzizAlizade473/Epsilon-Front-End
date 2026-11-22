import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  useCallback,
  useRef,
  useState,
  type ComponentType,
  type Ref,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  BackHandler,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  WebView as RNWebView,
  type WebViewMessageEvent,
} from 'react-native-webview';
import type { AndroidWebViewProps } from 'react-native-webview/lib/WebViewTypes';
import X from 'lucide-react-native/icons/x';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/design';
import { queryKeys } from '@/services/query';
import { isApiError } from '@/services/http/errors';
import type { Receipt } from '@/services';
import { ReceiptImageImport } from '../components/ReceiptImageImport';
import {
  EXPORT_BRIDGE_SCRIPT,
  isAllowedTopNavigation,
  officialReceiptUrl,
  parseExportMessage,
  parseStageMessage,
  type ImportStage,
} from '../ekassa/exportBridge';
import { importOfficialReceipt } from '../ekassa/importOfficialReceipt';
import { env } from '@/lib/env';

type Phase = 'page' | 'importing' | 'failed' | 'pageError' | 'manual';
type Problem = { key: string; fields: readonly string[]; code?: string };
/** Development builds show which pipeline stages were reached (no receipt content). */
const DIAGNOSTICS = env.EXPO_PUBLIC_APP_ENV === 'development';

// The library's combined iOS/Android/Windows props type collapses to `never` with
// this React types version; Epsilon is Android-first, so type it with the Android props.
type PageHandle = { reload(): void };
const WebView = RNWebView as unknown as ComponentType<
  AndroidWebViewProps & { ref?: Ref<PageHandle> }
>;

const problemKeys: Record<string, string> = {
  RECEIPT_IMAGE_INCOMPLETE: 'incomplete',
  RECEIPT_IMAGE_MISMATCH: 'mismatch',
  RECEIPT_READER_UNAVAILABLE: 'unavailable',
  RECEIPT_READER_QUOTA: 'quota',
  RECEIPT_READER_BUSY: 'busy',
  NETWORK: 'network',
  TIMEOUT: 'network',
};

/**
 * The official e-kassa receipt for a scanned fiscal QR, shown as the site itself.
 * When the customer taps the page's own download button, the exported image is read
 * and the native receipt (rating) screen opens. Nothing happens on a tap alone: only a
 * received, validated image moves the flow forward.
 */
export function OfficialReceiptScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useQueryClient();
  const params = useLocalSearchParams<{ qr?: string }>();
  const url = officialReceiptUrl(params.qr ?? '');
  const web = useRef<PageHandle>(null);
  const busy = useRef(false);
  const [phase, setPhase] = useState<Phase>('page');
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [stages, setStages] = useState<string[]>([]);
  const mark = (stage: ImportStage | 'DOWNLOAD_FAILED') =>
    setStages((done) => (done.includes(stage) ? done : [...done, stage]));

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/scan');
  }, [router]);
  useFocusEffect(
    useCallback(() => {
      const back = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!busy.current) close();
        return true;
      });
      return () => back.remove();
    }, [close]),
  );

  const open = useCallback(
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

  const onMessage = async (event: WebViewMessageEvent) => {
    if (!url) return;
    const stage = parseStageMessage(event.nativeEvent.data);
    if (stage) {
      mark(stage);
      if (stage === 'DOWNLOAD_FAILED' && !busy.current) {
        setProblem({ key: 'download', fields: [] });
        setPhase('failed');
      }
      return;
    }
    const exported = parseExportMessage(event.nativeEvent.data);
    // Ignore unrelated messages and repeated taps while one import runs.
    if (!exported || busy.current) return;
    mark('JPG_BYTES_RECEIVED');
    if ('problem' in exported) {
      setProblem({ key: 'format', fields: [], code: exported.problem });
      setPhase('failed');
      return;
    }
    mark('JPG_VALIDATED');
    busy.current = true;
    setProblem(null);
    setPhase('importing');
    try {
      mark('PARSING_STARTED');
      const receipt = await importOfficialReceipt(url, exported);
      mark('PARSING_FINISHED');
      mark('RATING_SCREEN_OPENED');
      open(receipt);
    } catch (cause) {
      setProblem({
        key: problemKeys[isApiError(cause) ? cause.code : ''] ?? 'unknown',
        fields: isApiError(cause) ? cause.fields : [],
        code: isApiError(cause) ? cause.code : String(cause),
      });
      setPhase('failed');
    } finally {
      busy.current = false;
    }
  };

  const retry = () => {
    setProblem(null);
    setStages([]);
    setPhase('page');
    setLoading(true);
    web.current?.reload();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon={X}
          accessibilityLabel={t('navigation.close')}
          disabled={phase === 'importing'}
          onPress={close}
        />
        <View style={styles.headerText}>
          <Text variant="headline" accessibilityRole="header">
            {t('officialImport.title')}
          </Text>
          <Text variant="caption" tone="secondary">
            {t('officialImport.hint')}
          </Text>
        </View>
      </View>
      {url ? (
        <View style={styles.page}>
          <WebView
            ref={web}
            source={{ uri: url }}
            injectedJavaScriptBeforeContentLoaded={EXPORT_BRIDGE_SCRIPT}
            onMessage={(event) => void onMessage(event)}
            onShouldStartLoadWithRequest={(request) =>
              request.isTopFrame === false ||
              isAllowedTopNavigation(request.url)
            }
            onLoadEnd={() => {
              setLoading(false);
              mark('EKASSA_PAGE_OPENED');
            }}
            onError={() => setPhase('pageError')}
            onHttpError={(event) => {
              if (event.nativeEvent.url.startsWith(url.split('#')[0]!))
                setPhase('pageError');
            }}
            setSupportMultipleWindows={false}
          />
          {loading && phase === 'page' && (
            <View style={styles.overlay} pointerEvents="none">
              <ActivityIndicator color={colors.brand.primary} />
              <Text tone="secondary">{t('officialImport.loading')}</Text>
            </View>
          )}
          {phase === 'importing' && (
            <View style={styles.overlay} accessibilityLiveRegion="polite">
              <ActivityIndicator color={colors.brand.primary} size="large" />
              <Text variant="headline">{t('capture.step.reading')}</Text>
              <Text tone="secondary">{t('capture.step.extracting')}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.page} />
      )}
      {(!url || phase === 'failed' || phase === 'pageError') && (
        <View style={styles.panel} accessibilityLiveRegion="polite">
          <Text variant="title2" accessibilityRole="alert">
            {t(
              !url
                ? 'scan.errors.unsupported.title'
                : phase === 'pageError'
                  ? 'officialImport.pageError'
                  : `scanImport.problem.${problem?.key ?? 'unknown'}`,
            )}
          </Text>
          {problem && problem.fields.length > 0 && (
            <Text>
              {t('scanImport.unreadable', {
                fields: problem.fields
                  .map((f) =>
                    t(`scanImport.field.${f.replace(' ', '_')}`, {
                      defaultValue: f,
                    }),
                  )
                  .join(', '),
              })}
            </Text>
          )}
          {DIAGNOSTICS && (
            <Text variant="caption" tone="secondary" selectable>
              {[...stages, problem?.code].filter(Boolean).join(' → ')}
            </Text>
          )}
          {url && <Button label={t('scan.retry')} onPress={retry} />}
          {url && (
            <Button
              variant="secondary"
              label={t('officialImport.manual')}
              onPress={() => setPhase('manual')}
            />
          )}
          <Button
            variant="ghost"
            label={t('scanImport.scanAgain')}
            onPress={close}
          />
        </View>
      )}
      {phase === 'manual' && url && (
        <ScrollView style={styles.panel} bounces={false}>
          <ReceiptImageImport qr={url} onImported={open} onScanAgain={close} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
  },
  headerText: { flex: 1 },
  page: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[12],
    padding: spacing[24],
    backgroundColor: colors.surface,
  },
  panel: {
    maxHeight: '70%',
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
});
