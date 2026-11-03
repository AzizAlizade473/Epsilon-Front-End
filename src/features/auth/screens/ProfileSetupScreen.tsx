import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { AuthHeading } from '@/components/ui/AuthHeading';
import { Brand } from '@/components/ui/Brand';
import UserRound from 'lucide-react-native/icons/user-round';
import { authOperation } from '@/lib/auth-lifecycle';
import { changeLanguage, type SupportedLanguage } from '@/lib/i18n';
import { serverNow } from '@/lib/server-clock';
import { env } from '@/lib/env';
import { useAuth, useAuthActions } from '@/providers/AuthProvider';
import { services } from '@/services';
import { isApiError } from '@/services/http/errors';
import { BirthDateField } from '../components/BirthDateField';
import { useOnboardingConfig } from '../hooks/useOnboardingConfig';
import {
  createProfileSchema,
  defaultBirthDate,
  type ProfileInput,
} from '../profile-schema';

export default function ProfileSetupScreen() {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const { updateUser } = useAuthActions();
  const config = useOnboardingConfig();
  const router = useRouter();
  const gate = useRef(false);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const today = serverNow();
  const resolver: Resolver<ProfileInput> = (values) => {
    const parsed = createProfileSchema(
      config.data?.minAge ?? auth.minimumAge ?? env.EXPO_PUBLIC_MIN_AGE,
      serverNow(),
    ).safeParse(values);
    if (parsed.success) return { values: parsed.data, errors: {} };
    const errors: Partial<
      Record<keyof ProfileInput, { type: string; message: string }>
    > = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ProfileInput;
      errors[key] ??= { type: 'validate', message: issue.message };
    }
    return { values: {}, errors };
  };
  const form = useForm<ProfileInput>({
    resolver,
    mode: 'onTouched',
    defaultValues: {
      firstName: auth.user?.firstName ?? '',
      lastName: auth.user?.lastName ?? '',
      birthDate: auth.user?.birthDate ?? defaultBirthDate(today),
      language: (['az', 'en', 'ru'].includes(i18n.language)
        ? i18n.language
        : 'az') as SupportedLanguage,
    },
  });
  const message = (key?: string) =>
    key ? t(key, { age: config.data?.minAge ?? auth.minimumAge }) : undefined;
  const submit = () =>
    form.handleSubmit(async (values) => {
      if (gate.current || !config.data || !authOperation.acquire()) return;
      const epoch = authOperation.epoch();
      gate.current = true;
      setSaving(true);
      setError(undefined);
      try {
        const result = await services.user.updateProfile(values);
        if (!authOperation.current(epoch)) return;
        router.replace(updateUser(result.user, result.nextStep));
      } catch (cause) {
        if (authOperation.current(epoch))
          setError(
            t(
              isApiError(cause) && cause.code === 'AGE_RESTRICTED'
                ? 'onboarding.ageRestricted'
                : isApiError(cause) && cause.code === 'VALIDATION_FAILED'
                  ? 'onboarding.profileInvalid'
                  : isApiError(cause) && cause.code === 'NETWORK'
                    ? 'errors.network'
                    : 'errors.generic',
              { age: config.data.minAge },
            ),
          );
      } finally {
        gate.current = false;
        setSaving(false);
        authOperation.release(epoch);
      }
    })();
  return (
    <Screen
      surface="surface"
      leading={<Brand />}
      footer={
        <Button
          label={t('common.continue')}
          loading={form.formState.isSubmitting || saving}
          disabled={!config.data}
          onPress={() => {
            void submit();
          }}
        />
      }
    >
      <AuthHeading
        icon={UserRound}
        title={t('navigation.profileSetup')}
        message={t('visual.profileSetup')}
      />
      {config.isError && (
        <>
          <Text accessibilityRole="alert">{t('errors.generic')}</Text>
          <Button
            variant="ghost"
            label={t('common.retry')}
            onPress={() => {
              void config.refetch();
            }}
          />
        </>
      )}
      {(['firstName', 'lastName'] as const).map((name) => (
        <Controller
          key={name}
          name={name}
          control={form.control}
          render={({ field, fieldState }) => (
            <Input
              label={t(`onboarding.${name}`)}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              autoFocus={name === 'firstName'}
              autoComplete={name === 'firstName' ? 'given-name' : 'family-name'}
              autoCapitalize="words"
              editable={!(form.formState.isSubmitting || saving)}
              error={message(fieldState.error?.message)}
            />
          )}
        />
      ))}
      <Controller
        name="birthDate"
        control={form.control}
        render={({ field, fieldState }) => (
          <BirthDateField
            value={field.value}
            onChange={(value) => {
              field.onChange(value);
              field.onBlur();
            }}
            maximumDate={today}
            disabled={form.formState.isSubmitting || saving}
            error={message(fieldState.error?.message)}
          />
        )}
      />
      {auth.user?.email && (
        <Text variant="caption">
          {t('onboarding.account', { email: auth.user.email })}
        </Text>
      )}
      <Controller
        name="language"
        control={form.control}
        render={({ field }) => (
          <SegmentedControl
            label={t('navigation.language')}
            value={field.value}
            disabled={form.formState.isSubmitting || saving}
            options={[
              { value: 'az', label: 'AZ' },
              { value: 'en', label: 'EN' },
              { value: 'ru', label: 'RU' },
            ]}
            onValueChange={(language: SupportedLanguage) => {
              field.onChange(language);
              void changeLanguage(language);
            }}
          />
        )}
      />
      {error && (
        <Text
          tone="danger"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </Screen>
  );
}
