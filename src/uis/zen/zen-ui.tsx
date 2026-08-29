import { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BoardWithUnused } from '@/components/game/board-with-unused';
import {
  BOX_GUIDE_SIDE_MIN_WIDTH,
  fitBoardWithUnusedSize,
} from '@/components/game/board-with-unused-layout';
import { StatusBanner } from '@/components/game/status-banner';
import { useKeyboardControls } from '@/components/game/use-keyboard-controls';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { getConflicts, hasAnyNotes } from '@/engine/rules';
import type { Difficulty, Digit } from '@/engine/types';
import type { SkinPalette } from '@/skins/types';
import { useGame, useGameDispatch } from '@/state/game-context';
import { useSettings } from '@/state/settings-context';
import { useActiveSkin } from '@/uis/ui-context';

import { DigitStrip, STRIP_HEIGHT } from './digit-strip';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const SPOTLIGHT_DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const EMPTY_SET = new Set<number>();

/** Zen lets the board grow as large as the window allows, within reason. */
const MAX_ZEN_BOARD = 640;
const STATUS_HEIGHT = 28;
const FOOTER_HEIGHT = 34;
/** Keeps the two footer groups visually related instead of spanning a wide screen. */
const FOOTER_MAX_WIDTH = 420;
/** Tall enough that the spotlight row's buttons are a real touch target. */
const SPOTLIGHT_HEIGHT = 36;
/**
 * Under this the spotlight row wraps onto a second line and costs the board
 * twice its height; measured in the running app, where it wraps at 470 and
 * fits on one line at 480.
 */
const SPOTLIGHT_ONE_LINE_WIDTH = 480;
const TOP_PADDING = Platform.OS === 'web' ? 64 : Spacing.three;
const FIXED_VERTICAL_CHROME =
  STATUS_HEIGHT +
  STRIP_HEIGHT +
  4 * Spacing.four +
  TOP_PADDING +
  // The safe area's own bottom padding, which the board must also leave room for.
  Spacing.three +
  BottomTabInset;

/**
 * A deliberately bare second UI: no toolbar, no cards, no themed chrome — the
 * skin's paper colour runs edge to edge and the board takes whatever room is
 * left. Everything else is one line of digits and one line of small controls.
 */
export function ZenUI() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const {
    showErrors,
    notesVisible,
    spotlight,
    setSpotlightOn,
    setSpotlightDigit,
    unusedNumbers,
  } = useSettings();
  const { skin, palette } = useActiveSkin();
  const { width, height } = useWindowDimensions();
  const [footerHeight, setFooterHeight] = useState(FOOTER_HEIGHT);

  useKeyboardControls(dispatch);

  const spotlightHeight = SPOTLIGHT_HEIGHT * (width < SPOTLIGHT_ONE_LINE_WIDTH ? 2 : 1);
  const availableWidth = width - 2 * Spacing.three;
  const boxPlacement = availableWidth >= BOX_GUIDE_SIDE_MIN_WIDTH ? 'side' : 'bottom';
  const boardSize = fitBoardWithUnusedSize({
    availableWidth,
    availableHeight: height - FIXED_VERTICAL_CHROME - spotlightHeight - footerHeight,
    maxBoardSize: MAX_ZEN_BOARD,
    visibility: unusedNumbers,
    boxPlacement,
    metrics: skin.metrics,
  });

  const [conflicts, hasNotes] = useMemo(
    () => [getConflicts(game.board), hasAnyNotes(game.board)] as const,
    [game.board],
  );
  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
    setFooterHeight(event.nativeEvent.layout.height);
  }, []);

  return (
    <View style={[styles.page, { backgroundColor: palette.boardBackground }]}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBanner status={game.status} difficulty={game.meta?.difficulty} palette={palette} />

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

        <DigitStrip
          board={game.board}
          palette={palette}
          skin={skin}
          width={boardSize}
          notesMode={game.notesMode}
          onDigit={(digit) => dispatch({ type: 'INPUT', digit })}
          onClear={() => dispatch({ type: 'CLEAR' })}
        />

        <View style={styles.spotlightRow}>
          <TextButton
            label="spotlight"
            palette={palette}
            activeColor={palette.spotlightText}
            active={spotlight.on}
            hitStyle={styles.spotlightHit}
            onPress={() => setSpotlightOn(!spotlight.on)}
          />
          {SPOTLIGHT_DIGITS.map((digit) => (
            <TextButton
              key={digit}
              label={String(digit)}
              palette={palette}
              activeColor={palette.spotlightText}
              active={spotlight.on && spotlight.digit === digit}
              disabled={!spotlight.on}
              hitStyle={[styles.spotlightHit, styles.spotlightDigit]}
              onPress={() => setSpotlightDigit(digit)}
            />
          ))}
        </View>

        <View onLayout={handleFooterLayout} style={styles.footer}>
          <View style={styles.footerGroup}>
            <TextButton
              label="undo"
              palette={palette}
              disabled={game.undoStack.length === 0}
              hitStyle={styles.footerHit}
              onPress={() => dispatch({ type: 'UNDO' })}
            />
            <TextButton
              label="notes"
              palette={palette}
              active={game.notesMode}
              hitStyle={styles.footerHit}
              onPress={() => dispatch({ type: 'SET_NOTES_MODE', on: !game.notesMode })}
            />
            <TextButton
              label="fill"
              palette={palette}
              disabled={game.status === 'won'}
              hitStyle={styles.footerHit}
              onPress={() => dispatch({ type: 'AUTOFILL_NOTES' })}
            />
            <TextButton
              label="wipe"
              accessibilityLabel="Wipe all notes"
              palette={palette}
              disabled={!hasNotes || game.status === 'won'}
              hitStyle={styles.footerHit}
              onPress={() => dispatch({ type: 'CLEAR_ALL_NOTES' })}
            />
          </View>
          <View style={styles.footerGroup}>
            <Text style={[styles.quiet, { color: palette.mutedText ?? palette.gridLine }]}>new</Text>
            {DIFFICULTIES.map((difficulty) => (
              <TextButton
                key={difficulty}
                label={difficulty}
                palette={palette}
                active={game.meta?.difficulty === difficulty}
                hitStyle={styles.footerHit}
                onPress={() => dispatch({ type: 'NEW_GAME', difficulty })}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function TextButton({
  label,
  accessibilityLabel,
  palette,
  active,
  activeColor,
  disabled,
  hitStyle,
  onPress,
}: {
  label: string;
  accessibilityLabel?: string;
  palette: SkinPalette;
  active?: boolean;
  /** Overrides the usual active ink — the spotlight row uses its own accent. */
  activeColor?: string;
  disabled?: boolean;
  /** Padding/minimum size for rows whose labels are too small to tap unaided. */
  hitStyle?: StyleProp<ViewStyle>;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: disabled ? 0.3 : pressed ? 0.5 : 1 },
        hitStyle,
      ]}>
      <Text
        style={{
          fontSize: 14,
          letterSpacing: 0.6,
          fontWeight: active ? '700' : '400',
          color: active ? (activeColor ?? palette.entryText) : palette.padText,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingTop: TOP_PADDING,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  footer: {
    width: '100%',
    maxWidth: FOOTER_MAX_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    columnGap: Spacing.four,
    rowGap: 0,
    minHeight: FOOTER_HEIGHT,
  },
  spotlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    // Row-gap stays 0: on a narrow window the row wraps, and the board is
    // width-constrained there anyway, so the extra line has room.
    columnGap: Spacing.one,
    minHeight: SPOTLIGHT_HEIGHT,
  },
  spotlightHit: {
    height: SPOTLIGHT_HEIGHT,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightDigit: {
    minWidth: SPOTLIGHT_HEIGHT,
  },
  footerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  footerHit: {
    height: FOOTER_HEIGHT,
    justifyContent: 'center',
  },
  quiet: {
    fontSize: 12,
    letterSpacing: 1,
  },
});
