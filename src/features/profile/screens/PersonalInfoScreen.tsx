import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ListRow } from '@/components/ui/ListRow';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { layout } from '@/design';
import { useProfile } from '@/hooks/useProfile';
import { profileNameSchema } from '@/lib/profile';
import { authOperation } from '@/lib/auth-lifecycle';
import { services, type User } from '@/services';
import { useAuthActions } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { ProfilePage } from '../components/ProfilePage';

export default function PersonalInfoScreen() {
  const query = useProfile();
  const { t } = useTranslation();
  return (
    <ProfilePage title={t('profile.personal')}>
      {query.data ? (
        <PersonalForm key={query.data.id} user={query.data} />
      ) : query.isLoading ? (
        <Skeleton
          width="100%"
          height={layout.controlHeight}
          accessibilityLabel={t('common.loading')}
        />
      ) : (
        <ErrorState
          title={t('errors.generic')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            void query.refetch();
          }}
        />
      )}
    </ProfilePage>
  );
}
function PersonalForm({ user }: { user: User }) {
  const { t } = useTranslation();
  const { updateUser } = useAuthActions();
  const toast = useToast();
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName, setLastName] = useState(user.lastName ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const lock = useRef(false);
  const dirty =
    firstName !== (user.firstName ?? '') || lastName !== (user.lastName ?? '');
  const save = async () => {
    if (lock.current) return;
    const first = profileNameSchema.safeParse(firstName);
    const last = profileNameSchema.safeParse(lastName);
    if (!first.success || !last.success) {
      setError(t('onboarding.invalidName'));
      return;
    }
    lock.current = true;
    setBusy(true);
    setError(undefined);
    const epoch = authOperation.epoch();
    try {
      const result = await services.user.updateProfile({
        firstName: first.data,
        lastName: last.data,
      });
      if (!authOperation.current(epoch)) return;
      if (result.user.id !== user.id) throw new Error('Profile mismatch');
      updateUser(result.user);
      setFirstName(result.user.firstName ?? '');
      setLastName(result.user.lastName ?? '');
      toast(t('profile.saved'));
    } catch {
      if (authOperation.current(epoch)) setError(t('errors.generic'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      <Input
        label={t('onboarding.firstName')}
        value={firstName}
        onChangeText={setFirstName}
        editable={!busy}
        maxLength={40}
      />
      <Input
        label={t('onboarding.lastName')}
        value={lastName}
        onChangeText={setLastName}
        editable={!busy}
        maxLength={40}
      />
      <ListRow title={t('profile.phone')} value={user.phone ?? undefined} />
      <Text variant="caption">{t('profile.phoneHelp')}</Text>
      <ListRow
        title={t('profile.birthDate')}
        value={user.birthDate ?? undefined}
      />
      <Text variant="headline" accessibilityRole="header">
        {t('profile.identities')}
      </Text>
      {user.identities.map((identity) => (
        <ListRow
          key={identity.provider}
          title={t(`profile.provider.${identity.provider}`)}
          value={identity.email ?? undefined}
        />
      ))}
      {error && (
        <Text tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      )}
      {dirty && (
        <Button
          label={t('profile.save')}
          loading={busy}
          onPress={() => {
            void save();
          }}
        />
      )}
    </>
  );
}
