import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { BoardSkin } from '@/skins/types';

import { SkinPreview } from './skin-preview';

interface SkinPickerProps {
  skins: BoardSkin[];
  selectedId: string;
  onSelect: (skinId: string) => void;
}

/** Row of miniature board previews; the active skin is outlined and checked. */
export function SkinPicker({ skins, selectedId, onSelect }: SkinPickerProps) {
  return (
    <View style={styles.row}>
      {skins.map((skin) => {
        const selected = skin.id === selectedId;
        return (
          <Pressable
            key={skin.id}
            role="radio"
            aria-checked={selected}
            onPress={() => onSelect(skin.id)}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView
              type={selected ? 'backgroundSelected' : 'backgroundElement'}
              style={styles.card}>
              <SkinPreview skin={skin} />
              <ThemedText
                type="small"
                themeColor={selected ? 'text' : 'textSecondary'}
                numberOfLines={2}
                style={styles.label}>
                {selected ? `✓ ${skin.name}` : skin.name}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  card: {
    width: 104,
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  label: {
    textAlign: 'center',
    // Two lines' worth, so cards line up whether or not the name wraps.
    height: 40,
  },
  pressed: {
    opacity: 0.7,
  },
});
