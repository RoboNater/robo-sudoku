import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BoardGrid } from '@/components/game/board-grid';
import { StatusBanner } from '@/components/game/status-banner';
import { useKeyboardControls } from '@/components/game/use-keyboard-controls';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { getConflicts } from '@/engine/rules';
import type { Difficulty } from '@/engine/types';
import type { SkinPalette } from '@/skins/types';
import { useGame, useGameDispatch } from '@/state/game-context';
import { useSettings } from '@/state/settings-context';
import { useActiveSkin } from '@/uis/ui-context';

import { DigitStrip, STRIP_HEIGHT } from './digit-strip';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const EMPTY_SET = new Set<number>();

/** Zen lets the board grow as large as the window allows, within reason. */
const MAX_ZEN_BOARD = 640;
const STATUS_HEIGHT = 28;
const FOOTER_HEIGHT = 34;
const TOP_PADDING = Platform.OS === 'web' ? 64 : Spacing.three;
const VERTICAL_CHROME =
  STATUS_HEIGHT + STRIP_HEIGHT + FOOTER_HEIGHT + 3 * Spacing.four + TOP_PADDING + BottomTabInset;

/**
 * A deliberately bare second UI: no toolbar, no cards, no themed chrome — the
 * skin's paper colour runs edge to edge and the board takes whatever room is
 * left. Everything else is one line of digits and one line of small controls.
 */
export function ZenUI() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const { showErrors } = useSettings();
  const { skin, palette } = useActiveSkin();
  const { width, height } = useWindowDimensions();

  useKeyboardControls(dispatch);

  const boardSize = Math.min(width - 2 * Spacing.three, height - VERTICAL_CHROME, MAX_ZEN_BOARD);

  const conflicts = useMemo(() => getConflicts(game.board), [game.board]);

  return (
    <View style={[styles.page, { backgroundColor: palette.boardBackground }]}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBanner status={game.status} difficulty={game.meta?.difficulty} palette={palette} />

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

        <DigitStrip
          board={game.board}
          palette={palette}
          skin={skin}
          width={boardSize}
          onDigit={(digit) => dispatch({ type: 'INPUT', digit })}
          onClear={() => dispatch({ type: 'CLEAR' })}
        />

        <View style={styles.footer}>
          <TextButton
            label="undo"
            palette={palette}
            disabled={game.undoStack.length === 0}
            onPress={() => dispatch({ type: 'UNDO' })}
          />
          <View style={styles.footerGroup}>
            <Text style={[styles.quiet, { color: palette.mutedText ?? palette.gridLine }]}>new</Text>
            {DIFFICULTIES.map((difficulty) => (
              <TextButton
                key={difficulty}
                label={difficulty}
                palette={palette}
                active={game.meta?.difficulty === difficulty}
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
  palette,
  active,
  disabled,
  onPress,
}: {
  label: string;
  palette: SkinPalette;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled ? 0.3 : pressed ? 0.5 : 1 })}>
      <Text
        style={{
          fontSize: 14,
          letterSpacing: 0.6,
          fontWeight: active ? '700' : '400',
          color: active ? palette.entryText : palette.padText,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.four,
    height: FOOTER_HEIGHT,
  },
  footerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  quiet: {
    fontSize: 12,
    letterSpacing: 1,
  },
});
