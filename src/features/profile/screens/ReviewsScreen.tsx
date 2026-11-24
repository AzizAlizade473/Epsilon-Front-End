import { FlashList } from '@shopify/flash-list';
import MessageSquare from 'lucide-react-native/icons/message-square';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { BackButton } from '@/components/navigation/BackButton';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { MockDataNotice } from '@/components/feedback/MockDataNotice';
import { colors, layout, radius, spacing } from '@/design';
import { useReviews } from '@/hooks/useProfile';
import { BrandBadge } from '@/components/brand/BrandBadge';
import { dishName } from '@/lib/dish-name';
import { OriginalStars } from '@/components/receipts/OriginalStars';
import { PressSurface } from '@/components/ui/PressSurface';
import { displayMerchantName } from '@/lib/brands';
import { reasonLabelKey } from '@/lib/quick-comments';
import { formatDate } from '@/lib/date';

export default function ReviewsScreen() {
  const query = useReviews();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lock = useRef(false);
  const next = async () => {
    if (lock.current || !query.hasNextPage || query.isFetching) return;
    lock.current = true;
    try {
      await query.fetchNextPage();
    } finally {
      lock.current = false;
    }
  };
  return (
    <Screen
      scroll={false}
      title={t('profile.reviews')}
      leading={
        <BackButton
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/profile')
          }
        />
      }
    >
      {query.isLoading ? (
        <DetailRowSkeleton />
      ) : query.isError && !query.data ? (
        <ErrorState
          title={t('errors.generic')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <FlashList
          data={query.data?.items ?? []}
          keyExtractor={(item) => item.feedbackId}
          onEndReached={() => {
            void next();
          }}
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          refreshControl={
            <PullToRefresh
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => {
                void query.refetch();
              }}
            />
          }
          onRefresh={() => {
            void query.refetch();
          }}
          ListHeaderComponent={<MockDataNotice />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.titleRow}>
                <BrandBadge
                  name={item.restaurantName}
                  logoUrl={item.restaurantLogoUrl}
                  size={40}
                />
                <View style={styles.title}>
                  <Text variant="headline">{dishName(item.dishName)}</Text>
                  <Text variant="caption" tone="secondary">
                    {displayMerchantName(item.restaurantName) +
                      ' · ' +
                      formatDate(item.createdAt, { locale: i18n.language }) +
                      (item.updatedAt ? ' · ' + t('rate.edited') : '')}
                  </Text>
                </View>
                <PressSurface
                  accessibilityRole="button"
                  accessibilityLabel={t('rate.editA11y', {
                    dish: dishName(item.dishName),
                  })}
                  onPress={() =>
                    router.push({
                      pathname: '/rate/[receiptItemId]',
                      params: {
                        receiptItemId: item.receiptItemId,
                        receiptId: item.receiptId,
                        feedbackId: item.feedbackId,
                      },
                    })
                  }
                  contentStyle={styles.edit}
                >
                  <Text variant="callout" style={styles.editText}>
                    {t('rate.edit')}
                  </Text>
                </PressSurface>
              </View>
              <OriginalStars value={item.rating} disabled />
              {item.reasonCodes.length > 0 && (
                <View style={styles.chips}>
                  {item.reasonCodes.map((code) => (
                    <View key={code} style={styles.chip}>
                      <Text variant="caption">{t(reasonLabelKey(code))}</Text>
                    </View>
                  ))}
                </View>
              )}
              {item.comment && <Text>{item.comment}</Text>}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={MessageSquare}
              title={t('profile.reviewsEmpty')}
              message={t('profile.reviewsBody')}
            />
          }
          ListFooterComponent={
            query.hasNextPage || query.isError ? (
              <View>
                {query.isError && (
                  <Text tone="danger" accessibilityRole="alert">
                    {t('errors.generic')}
                  </Text>
                )}
                <Button
                  variant="ghost"
                  loading={query.isFetchingNextPage}
                  label={t(query.isError ? 'common.retry' : 'wallet.more')}
                  onPress={() => {
                    if (query.isFetchNextPageError) void next();
                    else if (query.isError) void query.refetch();
                    else void next();
                  }}
                />
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  title: { flex: 1, gap: 2 },
  edit: {
    minHeight: layout.tapTarget,
    paddingHorizontal: spacing[12],
    justifyContent: 'center',
  },
  editText: { color: colors.brand.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
  chip: {
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[4],
    borderRadius: radius.pill,
    backgroundColor: colors.brand.tint,
  },
  row: {
    paddingVertical: spacing[16],
    borderBottomColor: colors.border,
    borderBottomWidth: layout.hairlineWidth,
    gap: spacing[8],
  },
});
