import { useRef, useState } from 'react';
import * as SecureStore from '@/lib/session-storage';
import { storageKeys } from '@/lib/bootstrap';
import { useTranslation } from 'react-i18next';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ProfilePage } from '../components/ProfilePage';
import { changeLanguage, type SupportedLanguage } from '@/lib/i18n';
import { authOperation } from '@/lib/auth-lifecycle';
import { services } from '@/services';
import { useAuthActions } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/providers/ToastProvider';
import { layout, spacing } from '@/design';
import { View } from 'react-native';
const languages = ['az', 'en', 'ru'] as const;
export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const { updateUser } = useAuthActions();
  const profile = useProfile();
  const toast = useToast();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<SupportedLanguage>();
  const select = async (language: SupportedLanguage) => {
    if (lock.current || !profile.data) return;
    const owner = profile.data.id;
    lock.current = true;
    setBusy(true);
    const epoch = authOperation.epoch();
    try {
      await changeLanguage(language, async () => undefined);
      if (!authOperation.current(epoch)) return;
      await SecureStore.setItemAsync(storageKeys.language, language);
      if (!authOperation.current(epoch)) return;
      const result = await services.user.updateProfile({ language });
      if (result.user.id !== owner || result.user.language !== language)
        throw new Error('Language was not confirmed');
      if (authOperation.current(epoch)) {
        updateUser(result.user);
        setPending(undefined);
      }
    } catch {
      if (authOperation.current(epoch)) {
        setPending(language);
        toast(t('profile.languageSyncError'));
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <ProfilePage title={t('profile.language')}>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('profile.language')}
      >
        {languages.map((language) => (
          <PressSurface
            key={language}
            disabled={busy || !profile.data}
            accessibilityRole="radio"
            accessibilityLabel={t(`profile.languages.${language}`)}
            accessibilityState={{ checked: i18n.language === language }}
            contentStyle={{
              minHeight: layout.controlHeight,
              paddingVertical: spacing[16],
            }}
            onPress={() => {
              void select(language);
            }}
          >
            <Text>
              {t(`profile.languages.${language}`)}
              {i18n.language === language ? ` · ${t('profile.selected')}` : ''}
            </Text>
          </PressSurface>
        ))}
      </View>
      {pending && (
        <>
          <Text tone="danger" accessibilityRole="alert">
            {t('profile.languageSyncError')}
          </Text>
          <Button
            label={t('common.retry')}
            loading={busy}
            onPress={() => {
              void select(pending);
            }}
          />
        </>
      )}
    </ProfilePage>
  );
}
