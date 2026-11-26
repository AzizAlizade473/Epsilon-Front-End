import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import MessageSquare from 'lucide-react-native/icons/message-square';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useOnline } from '@/components/feedback/OfflineNotice';
import { BackButton } from '@/components/navigation/BackButton';
import { OriginalStars } from '@/components/receipts/OriginalStars';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing } from '@/design';
import { useStaffRestaurants } from '@/hooks/useProfile';
import { formatDate } from '@/lib/date';
import { dishName } from '@/lib/dish-name';
import { services } from '@/services';
import type { StaffReview } from '@/services/contracts';
import { isApiError } from '@/services/http/errors';
import { generateIdempotencyKey } from '@/services/http/idempotency';
import { queryKeys } from '@/services/query';

type Editing = { review: StaffReview; mode: 'reply' | 'delete' };
const failureKeys: Record<string, string> = {
  REVIEW_HIDDEN: 'staff.reviewHidden',
  REPLY_HIDDEN: 'staff.replyHidden',
  FEEDBACK_NOT_FOUND: 'staff.gone',
};

function ReplySheet({
  editing,
  restaurantId,
  onClose,
}: {
  editing: Editing;
  restaurantId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const { review, mode } = editing;
  const [body, setBody] = useState(review.reply?.body ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const lock = useRef(false);
  const attempt = useRef<{ body: string; key: string } | null>(null);
  const remove = mode === 'delete';
  const submit = async () => {
    const text = remove ? '' : body.trim();
    if (lock.current || (!remove && !text)) return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    // The same text retried keeps its key; a changed text is a new write.
    if (attempt.current?.body !== text)
      attempt.current = {
        body: text,
        key: generateIdempotencyKey(remove ? 'reply-delete' : 'reply-put'),
      };
    const options = { idempotencyKey: attempt.current.key };
    try {
      if (remove) await services.staff.deleteReply(review.feedbackId, options);
      else await services.staff.reply(review.feedbackId, text, options);
      await client.invalidateQueries({
        queryKey: queryKeys.staff.reviews(restaurantId),
      });
      onClose();
    } catch (cause) {
      setError(
        t((isApiError(cause) && failureKeys[cause.code]) || 'staff.saveError'),
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const title = t(
    remove
      ? 'staff.deleteTitle'
      : review.reply
        ? 'staff.editTitle'
        : 'staff.replyTitle',
  );
  return (
    <Modal transparent visible onRequestClose={onClose}>
      <Sheet
        onClose={onClose}
        onBeforeClose={() => !lock.current}
        accessibilityLabel={title}
      >
        <View style={styles.sheet}>
          <Text variant="title2" accessibilityRole="header">
            {title}
          </Text>
          {remove ? (
            <>
              <Text>{t('staff.deleteBody')}</Text>
              {error && (
                <Text tone="danger" accessibilityRole="alert">
                  {error}
                </Text>
              )}
            </>
          ) : (
            <Input
              label={t('staff.yourReply')}
              hint={t('staff.publicHint')}
              value={body}
              onChangeText={setBody}
              maxLength={1000}
              multiline
              editable={!busy}
              error={error}
            />
          )}
          <Button
            variant={remove ? 'destructive' : 'primary'}
            label={t(remove ? 'staff.delete' : 'staff.publish')}
            loading={busy}
            disabled={!remove && !body.trim()}
            onPress={() => {
              void submit();
            }}
          />
          <Button
            variant="ghost"
            label={t('common.cancel')}
            disabled={busy}
            onPress={onClose}
          />
        </View>
      </Sheet>
    </Modal>
  );
}

export default function StaffReviewsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const online = useOnline();
  const restaurants = useStaffRestaurants();
  const [chosen, setChosen] = useState<string | null>(null);
  const places = restaurants.data?.items ?? [];
  const selected = places.find((p) => p.id === chosen) ?? places[0];
  const restaurantId = selected?.id ?? '';
  const query = useInfiniteQuery({
    queryKey: queryKeys.staff.reviews(restaurantId),
    enabled: Boolean(restaurantId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      services.staff.reviews(
        restaurantId,
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
  const [editing, setEditing] = useState<Editing | null>(null);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const pending = restaurants.isPending || (selected && query.isPending);
  const failed = restaurants.isError || (query.isError && !query.data);
  // Access is Epsilon's to grant: nobody else gets a staff screen.
  if (restaurants.data && !places.length) return <Redirect href="/profile" />;
  return (
    <Screen
      scroll={false}
      title={t('staff.title')}
      leading={
        <BackButton
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/profile')
          }
        />
      }
    >
      {places.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rail}
          contentContainerStyle={styles.chips}
        >
          {places.map((place) => (
            <Chip
              key={place.id}
              label={place.name}
              tone="brand"
              selected={place.id === restaurantId}
              onPress={() => setChosen(place.id)}
            />
          ))}
        </ScrollView>
      )}
      {places.length === 1 && <Text variant="headline">{selected!.name}</Text>}
      {failed ? (
        <ErrorState
          title={t('product.loadError')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            void restaurants.refetch();
            if (restaurantId) void query.refetch();
          }}
        />
      ) : pending ? (
        online ? (
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={t('common.loading')}
          >
            <DetailRowSkeleton />
          </View>
        ) : (
          <Text accessibilityRole="alert">{t('offline.notSaved')}</Text>
        )
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.feedbackId}
          refreshControl={
            <PullToRefresh
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => {
                void query.refetch();
              }}
            />
          }
          onEndReached={() => {
            if (
              query.hasNextPage &&
              !query.isFetching &&
              !query.isFetchNextPageError
            )
              void query.fetchNextPage();
          }}
          renderItem={({ item }) => {
            const name = dishName(item.dishName);
            const hidden = item.reply?.status === 'hidden';
            return (
              <View style={styles.row}>
                <Text variant="headline">{name}</Text>
                <Text variant="caption" tone="secondary">
                  {`${item.reviewer ?? t('staff.guest')} · ${formatDate(item.createdAt, { locale: i18n.language })}`}
                </Text>
                <OriginalStars value={item.rating} disabled />
                {item.comment && <Text>{item.comment}</Text>}
                {item.reply && (
                  <View style={styles.reply}>
                    <Text variant="caption" style={styles.status}>
                      {t(`staff.status.${item.reply.status}`)}
                    </Text>
                    <Text>{item.reply.body}</Text>
                  </View>
                )}
                <View style={styles.actions}>
                  {!hidden && (
                    <Button
                      variant="outline"
                      label={t(item.reply ? 'staff.edit' : 'staff.reply')}
                      accessibilityLabel={`${t(item.reply ? 'staff.edit' : 'staff.reply')}: ${name}`}
                      onPress={() =>
                        setEditing({ review: item, mode: 'reply' })
                      }
                    />
                  )}
                  {item.reply && (
                    <Button
                      variant="ghost"
                      label={t('staff.delete')}
                      accessibilityLabel={`${t('staff.delete')}: ${name}`}
                      onPress={() =>
                        setEditing({ review: item, mode: 'delete' })
                      }
                    />
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState icon={MessageSquare} title={t('staff.empty')} />
          }
          ListFooterComponent={
            query.hasNextPage || query.isError ? (
              <View>
                {query.isError && (
                  <Text tone="danger" accessibilityRole="alert">
                    {t('product.loadError')}
                  </Text>
                )}
                <Button
                  variant="ghost"
                  loading={query.isFetching}
                  label={t(query.isError ? 'common.retry' : 'product.loadMore')}
                  onPress={() => {
                    if (query.isFetching) return;
                    if (query.isError && !query.isFetchNextPageError)
                      void query.refetch();
                    else void query.fetchNextPage();
                  }}
                />
              </View>
            ) : null
          }
        />
      )}
      {editing && (
        <ReplySheet
          editing={editing}
          restaurantId={restaurantId}
          onClose={() => setEditing(null)}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  rail: { flexGrow: 0 },
  chips: { gap: spacing[8] },
  row: {
    gap: spacing[8],
    paddingVertical: spacing[16],
    borderBottomWidth: layout.hairlineWidth,
    borderBottomColor: colors.border,
  },
  reply: {
    gap: spacing[4],
    padding: spacing[12],
    borderRadius: radius[16],
    backgroundColor: colors.brand.tint,
  },
  status: { color: colors.brand.primary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
  sheet: { gap: spacing[16] },
});
