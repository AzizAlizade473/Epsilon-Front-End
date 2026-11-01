import { FlashList } from '@shopify/flash-list';
import MessageSquare from 'lucide-react-native/icons/message-square';
import Star from 'lucide-react-native/icons/star';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { BackButton } from '@/components/navigation/BackButton';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { MockDataNotice } from '@/components/feedback/MockDataNotice';
import { colors, layout, spacing } from '@/design';
import { useReviews } from '@/hooks/useProfile';
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
          onRefresh={() => {
            void query.refetch();
          }}
          ListHeaderComponent={<MockDataNotice />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text variant="headline">{item.dishName}</Text>
              <Text variant="caption">
                {item.restaurantName} ·{' '}
                {formatDate(item.createdAt, { locale: i18n.language })}
              </Text>
              <View
                accessible
                accessibilityLabel={t('feedback.ratingValue', {
                  count: item.rating,
                })}
                style={styles.stars}
              >
                {[1, 2, 3, 4, 5].map((score) => (
                  <Star
                    key={score}
                    accessible={false}
                    size={spacing[16]}
                    strokeWidth={layout.iconStrokeWidth}
                    color={colors.ink}
                    fill={
                      score <= item.rating ? colors.ink : colors.transparent
                    }
                  />
                ))}
              </View>
              {item.comment && <Text numberOfLines={2}>{item.comment}</Text>}
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
  row: {
    paddingVertical: spacing[16],
    borderBottomColor: colors.border,
    borderBottomWidth: layout.hairlineWidth,
    gap: spacing[8],
  },
  stars: { flexDirection: 'row', gap: spacing[4] },
});
