/**
 * 03.f — Developer Scenario Sheet.
 *
 * Lets developers quickly toggle mock scenarios during development.
 * Completely omitted in production builds (SEC-9).
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import X from 'lucide-react-native/icons/x';
import Check from 'lucide-react-native/icons/check';
import { Icon } from '@/components/ui/Icon';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/design';
import {
  getMockScenario,
  setMockScenario,
  type MockScenario,
} from '@/services/mock/scenario';

export type DevScenarioMenuProps = {
  visible: boolean;
  onClose: () => void;
  onSelectScenario?: (scenario: MockScenario) => void;
};

const SCENARIOS: MockScenario[] = [
  'success',
  'empty',
  'network_error',
  'unauthorized',
  'otp_invalid',
  'otp_expired',
  'receipt_already_claimed',
  'receipt_expired',
  'feedback_already_submitted',
  'receipt_unsupported',
  'receipt_not_found',
  'feedback_pending',
  'feedback_none',
  'feedback_validation',
  'wallet_long_history',
];

export function DevScenarioMenu({
  visible,
  onClose,
  onSelectScenario,
}: DevScenarioMenuProps) {
  const { t } = useTranslation();
  if (!__DEV__ || !visible) {
    return null;
  }

  const currentScenario = getMockScenario();

  const handleSelect = (scenario: MockScenario) => {
    setMockScenario(scenario);
    onSelectScenario?.(scenario);
    onClose();
  };

  return (
    <View style={styles.overlay} testID="dev-scenario-menu">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('dev.title')}</Text>
          <Pressable
            accessibilityLabel={t('navigation.close')}
            accessibilityRole="button"
            onPress={onClose}
            style={styles.closeButton}
            testID="dev-scenario-close"
          >
            <Icon icon={X} decorative />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {SCENARIOS.map((item) => {
            const isSelected = item === currentScenario;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={item}
                onPress={() => handleSelect(item)}
                style={[
                  styles.item,
                  isSelected ? styles.itemActive : undefined,
                ]}
                testID={`scenario-item-${item}`}
              >
                <View style={styles.itemHeader}>
                  <Text
                    style={[
                      styles.itemLabel,
                      isSelected ? styles.itemLabelActive : undefined,
                    ]}
                  >
                    {t(`dev.scenarios.${item}`)}
                  </Text>
                  {isSelected ? <Icon icon={Check} decorative /> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius[24],
    borderTopRightRadius: radius[24],
    maxHeight: '75%',
    paddingBottom: spacing[24],
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
  },
  title: {
    ...typography.headline,
    color: colors.ink,
  },
  closeButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  closeText: {
    color: colors.inkSecondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    padding: spacing[12],
  },
  item: {
    backgroundColor: colors.background,
    borderRadius: radius[12],
    marginBottom: spacing[8],
    minHeight: 44,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  },
  itemActive: {
    backgroundColor: colors.brand.tint,
    borderColor: colors.brand.primary,
    borderWidth: 1.5,
  },
  itemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemLabel: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
  },
  itemLabelActive: {
    color: colors.brand.primary,
  },
  itemDesc: {
    ...typography.caption,
    color: colors.inkSecondary,
    marginTop: 2,
  },
  activeCheck: {
    ...typography.caption,
    color: colors.brand.primary,
    fontWeight: '700',
  },
});
