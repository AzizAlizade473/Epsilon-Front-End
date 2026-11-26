import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { useOnline } from '@/components/feedback/OfflineNotice';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, layout, spacing } from '@/design';
import { authOperation } from '@/lib/auth-lifecycle';
import { formatDateGroup, formatTime } from '@/lib/date';
import { safeIdSchema } from '@/lib/deep-link';
import { useToast } from '@/providers/ToastProvider';
import { services } from '@/services';
import type { ScanAttempt } from '@/services/contracts';
import { isApiError } from '@/services/http/errors';
import { queryKeys } from '@/services/query';
import { scanReason } from '../scanReason';

const PREVIEW = 3;

function Row({
  item,
  busy,
  onOpen,
  onRetry,
}: {
  item: ScanAttempt;
  busy: boolean;
  onOpen: (receiptId: string) => void;
  onRetry: (qr: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const ok = item.status === 'success';
  const reason = ok ? null : scanReason(item.reason);
  const title = item.restaurantName ?? t('scans.unknownPlace');
  const status = ok ? t('scans.success') : t(`scans.kind.${reason!.kind}`);
  const when = `${formatDateGroup(item.at, { locale: i18n.language })}, ${formatTime(item.at)}`;
  const explanation = reason ? t(`scans.reason.${reason.key}`) : null;
  const receiptId =
    ok && safeIdSchema.safeParse(item.receiptId).success
      ? item.receiptId
      : null;
  const body = (
    <>
      <Icon
        icon={ok ? CircleCheck : CircleAlert}
        color={ok ? colors.successInk : colors.danger}
        decorative
      />
      <View style={styles.copy}>
        <Text variant="callout">{title}</Text>
        <Text variant="caption" tone="secondary">
          {`${status} · ${when}`}
        </Text>
        {explanation && <Text variant="caption">{explanation}</Text>}
      </View>
    </>
  );
  return (
    <View style={styles.item}>
      {receiptId ? (
        <PressSurface
          accessibilityLabel={[title, status, when].join(', ')}
          onPress={() => onOpen(receiptId)}
          contentStyle={styles.row}
          pressedColor={colors.divider}
        >
          {body}
        </PressSurface>
      ) : (
        <View style={styles.row}>{body}</View>
      )}
      {!ok && item.retryable && item.retryQr && (
        <Button
          variant="outline"
          label={t('scans.retry')}
          loading={busy}
          onPress={() => onRetry(item.retryQr!)}
        />
      )}
    </View>
  );
}

/** Scan outcomes under Recent activity: what worked, what did not and why. */
export function ScanActivity() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const client = useQueryClient();
  const online = useOnline();
  const [expanded, setExpanded] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const lock = useRef(false);
  const query = useInfiniteQuery({
    queryKey: queryKeys.activity.scans(),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      services.activity.scans(
        { limit: 20, ...(pageParam ? { cursor: pageParam } : {}) },
        { signal },
      ),
    getNextPageParam: (last, _pages, current, previous) =>
      last.nextCursor &&
      last.nextCursor !== current &&
      !previous.includes(last.nextCursor)
        ? last.nextCursor
        : undefined,
  });
  // Coming back from a scan shows its outcome.
  useFocusEffect(
    useCallback(() => {
      void client.invalidateQueries(
        { queryKey: queryKeys.activity.all },
        // The first focus must not restart the request that is already running.
        { cancelRefetch: false },
      );
    }, [client]),
  );
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const open = (receiptId: string) =>
    router.push({ pathname: '/receipt/[receiptId]', params: { receiptId } });
  const retry = async (id: string, qr: string) => {
    if (lock.current) return;
    lock.current = true;
    setRetrying(id);
    const epoch = authOperation.epoch();
    try {
      const receipt = await services.receipt.resolve({
        kind: 'qr',
        value: qr,
      });
      if (!authOperation.current(epoch)) return;
      client.setQueryData(queryKeys.receipt.detail(receipt.id), receipt);
      void client.invalidateQueries({ queryKey: queryKeys.receipt.list });
      open(receipt.id);
    } catch (error) {
      if (!authOperation.current(epoch)) return;
      // Same path as a fresh scan: no partner source means the official page.
      if (isApiError(error) && error.code === 'RECEIPT_SOURCE_UNAVAILABLE')
        router.push({ pathname: '/receipt-import', params: { qr } });
      else
        toast(
          t(
            `scans.reason.${scanReason(isApiError(error) ? error.code : null).key}`,
          ),
        );
    } finally {
      lock.current = false;
      setRetrying(null);
      void client.invalidateQueries({ queryKey: queryKeys.activity.all });
    }
  };
  const visible = expanded ? items : items.slice(0, PREVIEW);
  return (
    <View style={styles.section}>
      <Text variant="headline" accessibilityRole="header">
        {t('scans.title')}
      </Text>
      {query.isPending ? (
        online ? (
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={t('common.loading')}
          >
            <DetailRowSkeleton leadingSize={spacing[24]} />
          </View>
        ) : (
          <Text tone="secondary">{t('offline.notSaved')}</Text>
        )
      ) : (
        !query.isError &&
        !items.length && <Text tone="secondary">{t('scans.empty')}</Text>
      )}
      {visible.map((item) => (
        <Row
          key={item.id}
          item={item}
          busy={retrying === item.id}
          onOpen={open}
          onRetry={(qr) => {
            void retry(item.id, qr);
          }}
        />
      ))}
      {query.isError && (
        <>
          <Text accessibilityRole="alert">{t('scans.loadError')}</Text>
          <Button
            variant="ghost"
            label={t('scans.reload')}
            loading={query.isFetching}
            onPress={() => {
              void query.refetch();
            }}
          />
        </>
      )}
      {(items.length > PREVIEW && !expanded) ||
      (expanded && query.hasNextPage) ? (
        <Button
          variant="ghost"
          label={t('scans.more')}
          loading={query.isFetchingNextPage}
          onPress={() => {
            if (!expanded) setExpanded(true);
            else if (!query.isFetching) void query.fetchNextPage();
          }}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: spacing[8] },
  item: {
    gap: spacing[8],
    paddingBottom: spacing[8],
    borderBottomWidth: layout.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: spacing[12],
    paddingVertical: spacing[8],
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
});
