import az from '../../locales/az.json';
import en from '../../locales/en.json';
import ru from '../../locales/ru.json';
import type { SupportedLanguage } from './i18n';

export type LegalDocumentType = 'terms' | 'privacy';
const resources = { az, en, ru };
/** Draft metadata is not an effective policy or evidence of user acceptance. */
export function getLegalDocument(
  type: LegalDocumentType,
  locale: SupportedLanguage,
) {
  const body =
    resources[locale].legal[type === 'terms' ? 'termsBody' : 'privacyBody'];
  return {
    type,
    locale,
    version: 'draft-2026-11-02',
    updatedAt: '2026-11-02',
    draft: true,
    blocks: body.split(/\n\n+/).map((text, index) => ({
      id: `${type}-${index}`,
      heading: text.startsWith('## '),
      text: text.startsWith('## ') ? text.slice(3) : text,
    })),
  };
}
