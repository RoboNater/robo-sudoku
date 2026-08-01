import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

/** One labelled on/off setting; the counterpart to `OptionRow`'s pick-one. */
export function ToggleRow({ label, description, value, onValueChange }: ToggleRowProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <View style={styles.text}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {description && (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        )}
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
});
