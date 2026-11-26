import { useRef, useState } from 'react';
import * as SecureStore from '@/lib/session-storage';
import { storageKeys } from '@/lib/bootstrap';
import { useTranslation } from 'react-i18next';
import Check from 'lucide-react-native/icons/check';
import { Icon } from '@/components/ui/Icon';
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
import { colors, layout, radius, spacing } from '@/design';
import { StyleSheet, View } from 'react-native';
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
        style={styles.group}
      >
        {languages.map((language) => {
          const checked = i18n.language === language;
          return (
            <PressSurface
              key={language}
              disabled={busy || !profile.data}
              accessibilityRole="radio"
              accessibilityLabel={t(`profile.languages.${language}`)}
              accessibilityState={{ checked }}
              style={[styles.option, checked && styles.checked]}
              contentStyle={styles.content}
              onPress={() => {
                void select(language);
              }}
            >
              <Text style={styles.label}>
                {t(`profile.languages.${language}`)}
              </Text>
              {checked && (
                <Icon icon={Check} color={colors.brand.primary} decorative />
              )}
            </PressSurface>
          );
        })}
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
const styles = StyleSheet.create({
  group: { gap: spacing[8] },
  option: {
    borderRadius: radius[16],
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  checked: {
    backgroundColor: colors.brand.tint,
    borderColor: colors.brand.primary,
  },
  content: {
    minHeight: layout.controlHeight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[12],
    padding: spacing[16],
  },
  label: { flex: 1 },
});
