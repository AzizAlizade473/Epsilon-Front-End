import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/navigation/BackButton';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import {
  getLegalDocument,
  type LegalDocumentType,
} from '@/lib/legal-documents';

export function LegalScreen({ type }: { type: LegalDocumentType }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const locale =
    i18n.resolvedLanguage === 'en'
      ? 'en'
      : i18n.resolvedLanguage === 'ru'
        ? 'ru'
        : 'az';
  const document = useMemo(
    () => getLegalDocument(type, locale),
    [type, locale],
  );
  return (
    <Screen
      surface="surface"
      title={t(`auth.${type}`)}
      leading={
        <BackButton
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/welcome');
          }}
        />
      }
    >
      <Text variant="callout">{t('legal.draftNotice')}</Text>
      <Text variant="caption">
        {t('legal.updated', { date: document.updatedAt })}
      </Text>
      <Text variant="caption">
        {t('legal.version', { version: document.version })}
      </Text>
      {document.blocks.map((block) => (
        <Text
          key={block.id}
          variant={block.heading ? 'headline' : 'body'}
          accessibilityRole={block.heading ? 'header' : undefined}
        >
          {block.text}
        </Text>
      ))}
    </Screen>
  );
}
