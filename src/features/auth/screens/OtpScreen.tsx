import { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Animated, Platform, StyleSheet, useAnimatedValue } from 'react-native';
import {
  AndroidHaptics,
  NotificationFeedbackType,
  notificationAsync,
  performAndroidHapticsAsync,
} from 'expo-haptics';
import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { colors, layout, useMotion } from '@/design';
import { OtpInput } from '../components/OtpInput';
import { ResendTimer, useSecondsUntil } from '../components/ResendTimer';
import { usePhoneAuth } from '../hooks/usePhoneAuth';
import { maskPhone } from '../schemas';
import { otpChallenge, useOtpChallenge } from '../store';

export default function OtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const challenge = useOtpChallenge();
  const auth = usePhoneAuth();
  const [code, setCode] = useState('');
  const [completed, setCompleted] = useState(false);
  const flashOpacity = useAnimatedValue(0);
  const translateX = useAnimatedValue(0);
  const motion = useMotion();
  const locked = useSecondsUntil(challenge?.lockedUntil ?? 0) > 0;
  useEffect(() => {
    if (completed) otpChallenge.clear();
  }, [completed]);
  useEffect(() => {
    if (!auth.invalidAttempt) return;
    const feedback =
      Platform.OS === 'android'
        ? performAndroidHapticsAsync(AndroidHaptics.Reject)
        : notificationAsync(NotificationFeedbackType.Error);
    void feedback.catch(() => undefined);
    if (motion.reduceMotion) {
      flashOpacity.setValue(1);
      const flash = Animated.timing(flashOpacity, {
        toValue: 0,
        duration: layout.otpShakeDuration,
        useNativeDriver: true,
      });
      flash.start();
      return () => {
        flash.stop();
        flashOpacity.setValue(0);
      };
    }
    const animation = Animated.sequence(
      [1, -1, 1, -1, 1, 0].map((direction) =>
        Animated.timing(translateX, {
          toValue: direction * layout.otpShakeDistance,
          duration: layout.otpShakeDuration / 6,
          useNativeDriver: true,
        }),
      ),
    );
    animation.start();
    return () => {
      animation.stop();
      translateX.setValue(0);
    };
  }, [auth.invalidAttempt, motion.reduceMotion, translateX, flashOpacity]);
  const submit = async (value: string) => {
    const route = await auth.verifyCode(value);
    setCode('');
    if (route) {
      setCompleted(true);
      router.replace(route);
    }
  };
  if (!challenge && !completed) return <Redirect href="/phone" />;
  return (
    <Screen
      title={t('navigation.otp')}
      leading={<BackButton />}
      footer={
        <ResendTimer
          deadline={challenge?.resendAt ?? 0}
          busy={auth.busy}
          disabled={locked || completed}
          onResend={() => {
            if (challenge) {
              setCode('');
              void auth.requestCode(challenge.phone);
            }
          }}
        />
      }
    >
      <Text>
        {t('auth.otpHelper', { phone: maskPhone(challenge?.phone ?? '') })}
      </Text>
      <Animated.View
        style={{
          transform: [{ translateX }],
        }}
      >
        <OtpInput
          value={code}
          disabled={auth.busy || locked || completed}
          invalid={Boolean(auth.error)}
          onChange={(value) => {
            setCode(value);
            auth.clearError();
            if (value.length === 6) void submit(value);
          }}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.dangerTint, opacity: flashOpacity },
          ]}
        />
      </Animated.View>
      {auth.error && (
        <Text
          tone="danger"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {auth.error}
        </Text>
      )}
      {locked && (
        <Text accessibilityLiveRegion="polite">{t('auth.tooMany')}</Text>
      )}
      <Button
        label={t('auth.verifyCode')}
        disabled={code.length !== 6 || locked || completed}
        loading={auth.busy}
        onPress={() => {
          void submit(code);
        }}
      />
    </Screen>
  );
}
