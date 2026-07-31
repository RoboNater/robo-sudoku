import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Switch, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BoardGrid } from '@/components/game/board-grid';
import { NumberPad } from '@/components/game/number-pad';
import { StatusBanner } from '@/components/game/status-banner';
import { useKeyboardControls } from '@/components/game/use-keyboard-controls';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { getConflicts } from '@/engine/rules';
import type { Difficulty } from '@/engine/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGame, useGameDispatch } from '@/state/game-context';
import { useSettings } from '@/state/settings-context';

import { newspaperSkin } from './skins/newspaper';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const MAX_BOARD_SIZE = 520;
const EMPTY_SET = new Set<number>();

export function ClassicUI() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const { showErrors, setShowErrors } = useSettings();
  const scheme = useColorScheme();
  const { width } = useWindowDimensions();

  useKeyboardControls(dispatch);

  const skin = newspaperSkin;
  const palette = scheme === 'dark' ? skin.dark : skin.light;
  const boardSize = Math.min(width - 2 * Spacing.three, MAX_BOARD_SIZE);

  const conflicts = useMemo(() => getConflicts(game.board), [game.board]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.toolbar}>
          <ThemedText type="small" themeColor="textSecondary">
            New game:
          </ThemedText>
          {DIFFICULTIES.map((difficulty) => (
            <Chip
              key={difficulty}
              label={difficulty[0].toUpperCase() + difficulty.slice(1)}
              active={game.meta?.difficulty === difficulty}
              onPress={() => dispatch({ type: 'NEW_GAME', difficulty })}
            />
          ))}
        </View>

        <BoardGrid
          board={game.board}
          palette={palette}
          skin={skin}
          boardSize={boardSize}
          selected={game.selected}
          conflicts={showErrors ? conflicts : EMPTY_SET}
          onSelectCell={(index) =>
            dispatch({ type: 'SELECT', index: game.selected === index ? null : index })
          }
        />

        <StatusBanner status={game.status} difficulty={game.meta?.difficulty} palette={palette} />

        <NumberPad
          palette={palette}
          skin={skin}
          boardSize={boardSize}
          onDigit={(digit) => dispatch({ type: 'INPUT', digit })}
          onClear={() => dispatch({ type: 'CLEAR' })}
        />

        <View style={styles.bottomRow}>
          <Chip
            label={`Undo${game.undoStack.length > 0 ? ` (${game.undoStack.length})` : ''}`}
            active={false}
            disabled={game.undoStack.length === 0}
            onPress={() => dispatch({ type: 'UNDO' })}
          />
          <View style={styles.switchRow}>
            <Switch value={showErrors} onValueChange={setShowErrors} />
            <ThemedText type="small">Show errors</ThemedText>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function Chip({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={active ? 'backgroundSelected' : 'backgroundElement'}
        style={[styles.chip, disabled && styles.disabled]}>
        <ThemedText type="smallBold" themeColor={active ? 'text' : 'textSecondary'}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Platform.OS === 'web' ? 72 : Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});
