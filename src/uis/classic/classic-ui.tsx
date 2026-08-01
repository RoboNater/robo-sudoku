import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Switch, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BoardGrid, MAX_BOARD_SIZE } from '@/components/game/board-grid';
import { NumberPad } from '@/components/game/number-pad';
import { StatusBanner } from '@/components/game/status-banner';
import { useKeyboardControls } from '@/components/game/use-keyboard-controls';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { getConflicts } from '@/engine/rules';
import type { Difficulty } from '@/engine/types';
import type { NoteUnit } from '@/state/game-reducer';
import { useGame, useGameDispatch } from '@/state/game-context';
import { useSettings } from '@/state/settings-context';
import { useSetAutoClear } from '@/state/use-auto-clear';
import { useActiveLayout, useActiveSkin } from '@/uis/ui-context';

import { PAD_SIDE_MIN_WIDTH } from './layouts';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const AUTO_CLEAR_UNITS: { unit: NoteUnit; label: string }[] = [
  { unit: 'row', label: 'row' },
  { unit: 'col', label: 'col' },
  { unit: 'box', label: 'box' },
];
const SIDE_PAD_WIDTH = 200;
const EMPTY_SET = new Set<number>();

export function ClassicUI() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const { showErrors, setShowErrors } = useSettings();
  const setAutoClear = useSetAutoClear();
  const { skin, palette } = useActiveSkin();
  const layout = useActiveLayout();
  const { width } = useWindowDimensions();

  useKeyboardControls(dispatch);

  // `pad-side` only fits once the window is wide enough; otherwise it behaves
  // exactly like `pad-bottom`.
  const padSide = layout?.id === 'pad-side' && width >= PAD_SIDE_MIN_WIDTH;
  const available = padSide
    ? width - SIDE_PAD_WIDTH - Spacing.four - 2 * Spacing.three
    : width - 2 * Spacing.three;
  const boardSize = Math.min(available, MAX_BOARD_SIZE);

  const conflicts = useMemo(() => getConflicts(game.board), [game.board]);

  const board = (
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
  );

  const pad = (
    <NumberPad
      palette={palette}
      skin={skin}
      width={padSide ? SIDE_PAD_WIDTH : boardSize}
      variant={padSide ? 'grid' : 'row'}
      notesMode={game.notesMode}
      onDigit={(digit) => dispatch({ type: 'INPUT', digit })}
      onClear={() => dispatch({ type: 'CLEAR' })}
    />
  );

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

        {padSide ? (
          <View style={styles.sideRow}>
            {board}
            {pad}
          </View>
        ) : (
          board
        )}

        <StatusBanner status={game.status} difficulty={game.meta?.difficulty} palette={palette} />

        {!padSide && pad}

        <View style={styles.bottomRow}>
          <Chip
            label={`Undo${game.undoStack.length > 0 ? ` (${game.undoStack.length})` : ''}`}
            active={false}
            disabled={game.undoStack.length === 0}
            onPress={() => dispatch({ type: 'UNDO' })}
          />
          <Chip
            label="✎ Notes"
            active={game.notesMode}
            onPress={() => dispatch({ type: 'SET_NOTES_MODE', on: !game.notesMode })}
          />
          <Chip
            label="Autofill notes"
            active={false}
            disabled={game.status === 'won'}
            onPress={() => dispatch({ type: 'AUTOFILL_NOTES' })}
          />
          <View style={styles.switchRow}>
            <Switch value={showErrors} onValueChange={setShowErrors} />
            <ThemedText type="small">Show errors</ThemedText>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Auto-clear notes:
          </ThemedText>
          {AUTO_CLEAR_UNITS.map(({ unit, label }) => (
            <View key={unit} style={styles.switchRow}>
              <Switch
                value={game.autoClearNotes[unit]}
                onValueChange={(on) => setAutoClear(unit, on)}
              />
              <ThemedText type="small">{label}</ThemedText>
            </View>
          ))}
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
  sideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.three,
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
