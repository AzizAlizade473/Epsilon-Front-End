import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Heart from 'lucide-react-native/icons/heart';
import { BackButton } from '@/components/navigation/BackButton';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { PressSurface } from '@/components/ui/PressSurface';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { MockDataNotice } from '@/components/feedback/MockDataNotice';
import { FoodImage } from '@/components/food/FoodImage';
import { LikeButton } from '@/components/likes/LikeButton';
import { colors, layout, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import { useLikedList } from '@/hooks/useLikes';
import { likeDestination } from '@/hooks/likeTargets';
import { useToast } from '@/providers/ToastProvider';
import type { LikeItem, LikeKind } from '@/services/contracts';

function Row({ item }: { item: LikeItem }) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();
  const { kind, targetId, restaurantId, dishId, title, subtitle, imageUrl } =
    item;
  return (
    <View style={styles.row}>
      <PressSurface
        accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')}
        style={styles.open}
        contentStyle={styles.content}
        pressedColor={colors.divider}
        onPress={() => {
          const destination = likeDestination(item);
          if (destination) router.push(destination);
          else toast(t('likes.gone'));
        }}
      >
        <FoodImage
          uri={imageUrl}
          cover
          width={premium.rowThumb}
          height={premium.rowThumb}
        />
        <View style={styles.copy}>
          <Text variant="callout" numberOfLines={2}>
            {title}
          </Text>
          {subtitle !== '' && (
            <Text variant="caption" tone="secondary" numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
      </PressSurface>
      <LikeButton
        target={{
          kind,
          targetId,
          snapshot: { restaurantId, dishId, title, subtitle, imageUrl },
        }}
      />
    </View>
  );
}

export default function LikedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [kind, setKind] = useState<LikeKind>('dish');
  const query = useLikedList(kind);
  const items = query.data?.items ?? [];
  return (
    <Screen
      title={t('profile.likes')}
      scroll={false}
      leading={
        <BackButton
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/profile')
          }
        />
      }
    >
      <SegmentedControl
        label={t('profile.likes')}
        options={[
          { value: 'dish', label: t('likes.tabs.dish') },
          { value: 'review', label: t('likes.tabs.review') },
          { value: 'restaurant', label: t('likes.tabs.restaurant') },
        ]}
        value={kind}
        onValueChange={setKind}
      />
      <MockDataNotice />
      <FlashList
        // A new list per tab: scroll offsets never leak between tabs.
        key={kind}
        data={items}
        keyExtractor={(item) => item.targetId}
        renderItem={({ item }) => <Row item={item} />}
        refreshControl={
          <PullToRefresh
            refreshing={query.isRefetching}
            onRefresh={() => {
              void query.refetch();
            }}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (
            query.hasNextPage &&
            !query.isFetching &&
            !query.isFetchNextPageError
          )
            void query.fetchNextPage();
        }}
        ListEmptyComponent={
          query.isPending ? (
            <View
              accessibilityRole="progressbar"
              accessibilityLabel={t('common.loading')}
            >
              <DetailRowSkeleton />
            </View>
          ) : query.isError ? (
            <ErrorState
              title={t('product.loadError')}
              retryLabel={t('common.retry')}
              loading={query.isFetching}
              onRetry={() => {
                void query.refetch();
              }}
            />
          ) : (
            <EmptyState
              icon={Heart}
              title={t(`likes.empty.${kind}`)}
              message={t('likes.emptyBody')}
            />
          )
        }
        ListFooterComponent={
          <>
            {query.isError && items.length > 0 && (
              <Text accessibilityRole="alert">{t('product.loadError')}</Text>
            )}
            {query.hasNextPage && (
              <Button
                variant="ghost"
                label={t('product.loadMore')}
                loading={query.isFetchingNextPage}
                onPress={() => {
                  if (!query.isFetching) void query.fetchNextPage();
                }}
              />
            )}
          </>
        }
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[12],
    paddingRight: spacing[8],
    borderRadius: radius[16],
    borderWidth: layout.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  open: { flex: 1, minWidth: 0 },
  content: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: spacing[12],
    padding: spacing[12],
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
});
