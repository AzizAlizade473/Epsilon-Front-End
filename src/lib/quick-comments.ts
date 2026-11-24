/**
 * Six quick comments per star rating, by stable id (the server keeps the same
 * catalogue with each id's dimension and sentiment, and checks the rating
 * matches). Labels live in locales under rate.qc.<id>; the question for each
 * rating under rate.ask.<rating>.
 */
export const quickComments = {
  1: [
    'poor_taste',
    'not_fresh',
    'served_cold',
    'poor_preparation',
    'disappointing_portion',
    'not_worth_price',
  ],
  2: [
    'needed_more_flavor',
    'temperature_could_improve',
    'portion_too_small',
    'texture_not_right',
    'presentation_could_improve',
    'too_expensive_for_quality',
  ],
  3: [
    'average_taste',
    'acceptable_portion',
    'fair_price',
    'nothing_special',
    'could_be_fresher',
    'room_for_improvement',
  ],
  4: [
    'great_taste',
    'fresh_ingredients',
    'good_portion',
    'nicely_prepared',
    'good_presentation',
    'good_value',
  ],
  5: [
    'amazing_taste',
    'exceptionally_fresh',
    'perfectly_prepared',
    'perfect_portion',
    'beautiful_presentation',
    'would_order_again',
  ],
} as const satisfies Record<1 | 2 | 3 | 4 | 5, readonly string[]>;

export const commentsFor = (rating: number): readonly string[] =>
  rating >= 1 && rating <= 5 ? quickComments[rating as 1 | 2 | 3 | 4 | 5] : [];

/** Codes from earlier app versions, shown with their old labels (feedback.reasons.*). */
export const legacyReasonCodes = [
  'taste',
  'temperature',
  'portion',
  'price',
  'presentation',
  'wait_time',
  'freshness',
  'service',
  'other',
] as const;

/** Translation key for any stored code, new or legacy. */
export const reasonLabelKey = (code: string) =>
  (legacyReasonCodes as readonly string[]).includes(code)
    ? `feedback.reasons.${code}`
    : `rate.qc.${code}`;
