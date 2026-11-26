import { useQuery } from '@tanstack/react-query';
import { OfficialReply } from '@/components/reviews/OfficialReply';
import { services } from '@/services';
import { queryKeys } from '@/services/query';

/** The answer to a rated dish; stays silent while there is none to show. */
export function ReceiptReply({ feedbackId }: { feedbackId: string }) {
  const review = useQuery({
    queryKey: queryKeys.feedback.detail(feedbackId),
    queryFn: ({ signal }) => services.feedback.get(feedbackId, { signal }),
  });
  return review.data?.reply ? (
    <OfficialReply feedbackId={feedbackId} reply={review.data.reply} />
  ) : null;
}
