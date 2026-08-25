import { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MAX_BOARD_SIZE } from '@/components/game/board-grid';
import { BoardWithUnused } from '@/components/game/board-with-unused';
import {
  BOX_GUIDE_SIDE_MIN_WIDTH,
  fitBoardWithUnusedSize,
  getBoardWithUnusedGeometry,
} from '@/components/game/board-with-unused-layout';
import { NumberPad } from '@/components/game/number-pad';
import { StatusBanner } from '@/components/game/status-banner';
import { useKeyboardControls } from '@/components/game/use-keyboard-controls';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { getConflicts } from '@/engine/rules';
import type { Difficulty, Digit } from '@/engine/types';
import type { SkinPalette } from '@/skins/types';
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
const SPOTLIGHT_DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const SIDE_PAD_WIDTH = 200;
const MIN_CLASSIC_BOARD_SIZE = 280;
const EMPTY_SET = new Set<number>();
const CLASSIC_TOP_PADDING = Platform.OS === 'web' ? 72 : Spacing.three;
const CLASSIC_BOTTOM_PADDING = BottomTabInset + Spacing.three;
const CLASSIC_TOP_LEVEL_GAPS = 2 * Spacing.three;

export function ClassicUI() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const {
    showErrors,
    setShowErrors,
    notesVisible,
    setNotesVisible,
    spotlight,
    setSpotlightOn,
    setSpotlightDigit,
    unusedNumbers,
  } = useSettings();
  const setAutoClear = useSetAutoClear();
  const { skin, palette } = useActiveSkin();
  const layout = useActiveLayout();
  const { width } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [toolbarHeight, setToolbarHeight] = useState<number | null>(null);
  const [controlsHeight, setControlsHeight] = useState<number | null>(null);

  useKeyboardControls(dispatch);

  // `pad-side` only fits once the window is wide enough; otherwise it behaves
  // exactly like `pad-bottom`.
  const padSide = layout?.id === 'pad-side' && width >= PAD_SIDE_MIN_WIDTH;
  const available = padSide
    ? width - SIDE_PAD_WIDTH - Spacing.four - 2 * Spacing.three
    : width - 2 * Spacing.three;
  const boxPlacement = available >= BOX_GUIDE_SIDE_MIN_WIDTH ? 'side' : 'bottom';
  const guidesVisible = unusedNumbers.row || unusedNumbers.col || unusedNumbers.box;
  const minimumFrameHeight = getBoardWithUnusedGeometry(
    MIN_CLASSIC_BOARD_SIZE,
    unusedNumbers,
    boxPlacement,
    skin.metrics,
  ).height;
  const measuredChromeHeight =
    toolbarHeight !== null && controlsHeight !== null
      ? CLASSIC_TOP_PADDING +
        CLASSIC_BOTTOM_PADDING +
        CLASSIC_TOP_LEVEL_GAPS +
        toolbarHeight +
        controlsHeight
      : null;
  const availableHeight =
    guidesVisible && viewportHeight !== null && measuredChromeHeight !== null
      ? Math.max(viewportHeight - measuredChromeHeight, minimumFrameHeight)
      : undefined;
  const boardSize = fitBoardWithUnusedSize({
    availableWidth: available,
    availableHeight,
    maxBoardSize: MAX_BOARD_SIZE,
    visibility: unusedNumbers,
    boxPlacement,
    metrics: skin.metrics,
  });
  const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportHeight(event.nativeEvent.layout.height);
  }, []);
  const handleToolbarLayout = useCallback((event: LayoutChangeEvent) => {
    setToolbarHeight(event.nativeEvent.layout.height);
  }, []);
  const handleControlsLayout = useCallback((event: LayoutChangeEvent) => {
    setControlsHeight(event.nativeEvent.layout.height);
  }, []);

  const conflicts = useMemo(() => getConflicts(game.board), [game.board]);

  const board = (
    <BoardWithUnused
      board={game.board}
      palette={palette}
      skin={skin}
      boardSize={boardSize}
      selected={game.selected}
      conflicts={showErrors ? conflicts : EMPTY_SET}
      notesVisible={game.notesMode || notesVisible}
      spotlight={spotlight.on ? spotlight.digit : null}
      unusedNumbers={unusedNumbers}
      boxPlacement={boxPlacement}
      onSelectCell={(index) =>
        dispatch({ type: 'SELECT', index: game.selected === index ? null : index })
      }
    />
  );

  const pad = (
    <NumberPad
      board={game.board}
      palette={palette}
      skin={skin}
      width={padSide ? SIDE_PAD_WIDTH : boardSize}
      variant={padSide ? 'grid' : 'row'}
      notesMode={game.notesMode}
      onDigit={(digit) => dispatch({ type: 'INPUT', digit })}
      onClear={() => dispatch({ type: 'CLEAR' })}
    />
  );

  const entryControls = (
    <View style={styles.entryControls}>
      <InputModeControl
        notesMode={game.notesMode}
        palette={palette}
        stacked={padSide}
        onChange={(on) => dispatch({ type: 'SET_NOTES_MODE', on })}
      />
      {pad}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.content, guidesVisible && styles.guidedContent]}
          onLayout={handleViewportLayout}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}>
          <View onLayout={handleToolbarLayout} style={styles.toolbar}>
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
              {entryControls}
            </View>
          ) : (
            board
          )}

          <View onLayout={handleControlsLayout} style={styles.controls}>
            <StatusBanner
              status={game.status}
              difficulty={game.meta?.difficulty}
              palette={palette}
            />

            {!padSide && entryControls}

            <View style={styles.bottomRow}>
              <Chip
                label={`Undo${game.undoStack.length > 0 ? ` (${game.undoStack.length})` : ''}`}
                active={false}
                disabled={game.undoStack.length === 0}
                onPress={() => dispatch({ type: 'UNDO' })}
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
              <View style={styles.switchRow}>
                <Switch value={notesVisible} onValueChange={setNotesVisible} />
                <ThemedText type="small">Show notes</ThemedText>
              </View>
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.switchRow}>
                <Switch value={spotlight.on} onValueChange={setSpotlightOn} />
                <ThemedText type="small">Spotlight</ThemedText>
              </View>
              <View style={styles.digitRow}>
                {SPOTLIGHT_DIGITS.map((digit) => (
                  <Chip
                    key={digit}
                    label={String(digit)}
                    compact
                    active={spotlight.on && spotlight.digit === digit}
                    disabled={!spotlight.on}
                    onPress={() => setSpotlightDigit(digit)}
                  />
                ))}
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
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function InputModeControl({
  notesMode,
  palette,
  stacked,
  onChange,
}: {
  notesMode: boolean;
  palette: SkinPalette;
  stacked: boolean;
  onChange: (notesMode: boolean) => void;
}) {
  const mutedText = palette.mutedText ?? palette.gridLine;

  return (
    <View style={[styles.inputModeRow, stacked && styles.inputModeStacked]}>
      <Text style={[styles.inputModeLabel, { color: mutedText }]}>Input mode:</Text>
      <View
        role="radiogroup"
        aria-label="Input mode"
        style={[styles.segmentedControl, { backgroundColor: palette.padBackground }]}>
        <InputModeOption
          label="Number"
          palette={palette}
          selected={!notesMode}
          onPress={() => onChange(false)}
        />
        <InputModeOption
          label="Notes"
          palette={palette}
          selected={notesMode}
          onPress={() => onChange(true)}
        />
      </View>
    </View>
  );
}

function InputModeOption({
  label,
  palette,
  selected,
  onPress,
}: {
  label: string;
  palette: SkinPalette;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="radio"
      aria-checked={selected}
      accessibilityLabel={`${label} mode`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.inputModeOption,
        { backgroundColor: selected || pressed ? palette.padPressed : 'transparent' },
        pressed && styles.pressed,
      ]}>
      <Text
        style={[
          styles.inputModeOptionText,
          { color: palette.padText, opacity: selected ? 1 : 0.6 },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Chip({
  label,
  active,
  compact,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  /** Narrower padding, for the tight run of spotlight digits. */
  compact?: boolean;
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
        style={[styles.chip, compact && styles.chipCompact, disabled && styles.disabled]}>
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
    width: '100%',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: CLASSIC_TOP_PADDING,
    paddingBottom: CLASSIC_BOTTOM_PADDING,
  },
  guidedContent: {
    justifyContent: 'flex-start',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  controls: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.three,
  },
  sideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  entryControls: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  inputModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  inputModeStacked: {
    flexDirection: 'column',
    gap: Spacing.one,
  },
  inputModeLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: Spacing.half,
    padding: Spacing.half,
    borderRadius: Spacing.three,
  },
  inputModeOption: {
    minWidth: 72,
    alignItems: 'center',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  inputModeOptionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  digitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.one,
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
  chipCompact: {
    paddingHorizontal: Spacing.two,
    minWidth: 30,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});
