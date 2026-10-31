/**
 * 04.d — Locale-aware date and time formatting.
 *
 * Requirements:
 * - Date grouping: "Bu gün" (Today), "Dünən" (Yesterday), else formatted date e.g. "12 Oktyabr 2026"
 * - Time: "HH:mm" (24h format, padded)
 * - Deterministic and locale-aware across az, en, ru
 */

import { i18n } from './i18n';

const MONTH_NAMES: Record<'az' | 'en' | 'ru', string[]> = {
  az: [
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'İyun',
    'İyul',
    'Avqust',
    'Sentyabr',
    'Oktyabr',
    'Noyabr',
    'Dekabr',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  ru: [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ],
};

const RELATIVE_DAY_LABELS: Record<
  'az' | 'en' | 'ru',
  { today: string; yesterday: string }
> = {
  az: { today: 'Bu gün', yesterday: 'Dünən' },
  en: { today: 'Today', yesterday: 'Yesterday' },
  ru: { today: 'Сегодня', yesterday: 'Вчера' },
};

function normalizeLocale(lng?: string): 'az' | 'en' | 'ru' {
  const code = (lng ?? i18n.language ?? 'az').toLowerCase().slice(0, 2);
  if (code === 'en') return 'en';
  if (code === 'ru') return 'ru';
  return 'az';
}

function parseDate(input: string | Date): Date {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) {
    throw new RangeError(`Invalid date input: ${String(input)}`);
  }
  return d;
}

export function formatTime(dateInput: string | Date): string {
  const d = parseDate(dateInput);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDate(
  dateInput: string | Date,
  options?: { locale?: string },
): string {
  const d = parseDate(dateInput);
  const locale = normalizeLocale(options?.locale);
  const day = d.getDate();
  const month = MONTH_NAMES[locale][d.getMonth()]!;
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

export function formatDateGroup(
  dateInput: string | Date,
  options?: { locale?: string; referenceDate?: Date },
): string {
  const d = parseDate(dateInput);
  const locale = normalizeLocale(options?.locale);
  const ref = options?.referenceDate ?? new Date();

  // Compare calendar days in local time
  const targetDay = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
  ).getTime();
  const refDay = new Date(
    ref.getFullYear(),
    ref.getMonth(),
    ref.getDate(),
  ).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((refDay - targetDay) / oneDayMs);

  if (diffDays === 0) {
    return RELATIVE_DAY_LABELS[locale].today;
  }
  if (diffDays === 1) {
    return RELATIVE_DAY_LABELS[locale].yesterday;
  }

  return formatDate(d, { locale });
}
