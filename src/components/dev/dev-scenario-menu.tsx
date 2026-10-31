/**
 * 03.f — Developer Scenario Sheet.
 *
 * Lets developers quickly toggle mock scenarios during development.
 * Completely omitted in production builds (SEC-9).
 */

import React from 'react';
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

const SCENARIOS: { id: MockScenario; label: string; desc: string }[] = [
  {
    id: 'success',
    label: 'Uğurlu (Success)',
    desc: 'Normal server cavabı və zəngin məlumatlar',
  },
  {
    id: 'empty',
    label: 'Boş siyahı (Empty)',
    desc: 'Boş restoranlar, sıfır balans, boş tarixçə',
  },
  {
    id: 'network_error',
    label: 'Şəbəkə xətası (Network)',
    desc: 'Simulyasiya edilmiş şəbəkə kəsilməsi (status 0)',
  },
  {
    id: 'unauthorized',
    label: '401 İcazəsiz (Unauthorized)',
    desc: 'Sessiyanın bitməsi və təkrar yönləndirmə',
  },
  {
    id: 'otp_invalid',
    label: 'Yanlış OTP (OTP Invalid)',
    desc: 'OTP yoxlaması 400 OTP_INVALID qaytarır',
  },
  {
    id: 'otp_expired',
    label: 'Vaxtı bitmiş OTP (OTP Expired)',
    desc: 'OTP yoxlaması 400 OTP_EXPIRED qaytarır',
  },
  {
    id: 'receipt_already_claimed',
    label: 'Qəbz artıq istifadə edilib',
    desc: 'Qəbz 409 RECEIPT_ALREADY_CLAIMED qaytarır',
  },
  {
    id: 'receipt_expired',
    label: 'Qəbzin vaxtı bitib',
    desc: 'Qəbz 410 RECEIPT_EXPIRED qaytarır',
  },
  {
    id: 'feedback_already_submitted',
    label: 'Rəy artıq göndərilib',
    desc: '409 FEEDBACK_ALREADY_SUBMITTED xətası',
  },
];

export function DevScenarioMenu({
  visible,
  onClose,
  onSelectScenario,
}: DevScenarioMenuProps) {
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
          <Text style={styles.title}>🛠 Mock Ssenariləri (Dev Menu)</Text>
          <Pressable
            accessibilityLabel="Bağla"
            accessibilityRole="button"
            onPress={onClose}
            style={styles.closeButton}
            testID="dev-scenario-close"
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {SCENARIOS.map((item) => {
            const isSelected = item.id === currentScenario;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={item.id}
                onPress={() => handleSelect(item.id)}
                style={[
                  styles.item,
                  isSelected ? styles.itemActive : undefined,
                ]}
                testID={`scenario-item-${item.id}`}
              >
                <View style={styles.itemHeader}>
                  <Text
                    style={[
                      styles.itemLabel,
                      isSelected ? styles.itemLabelActive : undefined,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected ? (
                    <Text style={styles.activeCheck}>✓ Aktiv</Text>
                  ) : null}
                </View>
                <Text style={styles.itemDesc}>{item.desc}</Text>
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
