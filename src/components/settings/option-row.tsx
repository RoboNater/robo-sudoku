import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface OptionRowProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

/** Single-choice row with a check mark, used by the UI and layout pickers. */
export function OptionRow({ label, description, selected, onPress }: OptionRowProps) {
  return (
    <Pressable
      role="radio"
      aria-checked={selected}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type={selected ? 'backgroundSelected' : 'backgroundElement'} style={styles.row}>
        <View style={styles.text}>
          <ThemedText type="smallBold">{label}</ThemedText>
          {!!description && (
            <ThemedText type="small" themeColor="textSecondary">
              {description}
            </ThemedText>
          )}
        </View>
        <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
          {selected ? '✓' : ''}
        </ThemedText>
      </ThemedView>
    </Pressable>
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
  pressed: {
    opacity: 0.7,
  },
});
