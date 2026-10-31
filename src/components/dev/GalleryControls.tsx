import Check from 'lucide-react-native/icons/check';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { GalleryCopy } from './galleryCopy';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { ListRow } from '@/components/ui/ListRow';
import { Switch } from '@/components/ui/Switch';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design';

export function GalleryControls({
  copy,
  onAction,
}: {
  copy: GalleryCopy;
  onAction: () => void;
}) {
  const [selected, setSelected] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [value, setValue] = useState('');
  return (
    <View style={styles.section}>
      <Text variant="title2" accessibilityRole="header">
        {copy.controls}
      </Text>
      <Button label={copy.primary} onPress={onAction} />
      <Button label={copy.secondary} variant="secondary" onPress={onAction} />
      <Button label={copy.ghost} variant="ghost" onPress={onAction} />
      <Button
        label={copy.destructive}
        variant="destructive"
        onPress={onAction}
      />
      <Button label={copy.loading} loading onPress={onAction} />
      <Button label={copy.disabled} disabled onPress={onAction} />
      <View style={styles.row}>
        <IconButton
          icon={Check}
          accessibilityLabel={copy.primary}
          onPress={onAction}
        />
        <Icon icon={Check} accessibilityLabel={copy.primary} />
        <Chip
          label={copy.chipLabel}
          selected={selected}
          onPress={() => setSelected(!selected)}
        />
        <Chip label={copy.loading} tone="warning" />
      </View>
      <Card>
        <ListRow
          title={copy.rowTitle}
          subtitle={copy.rowSubtitle}
          icon={Check}
        />
        <ListRow
          title={copy.rowTitle}
          value={copy.rowValue}
          onPress={onAction}
          divider={false}
        />
      </Card>
      <View style={styles.row}>
        <Text style={styles.label}>{copy.switchLabel}</Text>
        <Switch
          label={copy.switchLabel}
          value={enabled}
          onValueChange={setEnabled}
        />
      </View>
      <Input
        label={copy.inputLabel}
        hint={copy.inputHint}
        value={value}
        onChangeText={setValue}
      />
      <Input
        label={`${copy.inputLabel}: ${copy.errorTitle}`}
        error={copy.inputError}
        value={value}
        onChangeText={setValue}
      />
      <Input
        label={`${copy.inputLabel}: ${copy.disabled}`}
        editable={false}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[16] },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[12],
  },
  label: { flex: 1 },
});
