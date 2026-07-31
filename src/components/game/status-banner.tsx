import { Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import type { Difficulty } from '@/engine/types';
import type { SkinPalette } from '@/skins/types';
import type { GameStatus } from '@/state/game-reducer';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

/** Solved: the message springs in and settles. */
const winKeyframe = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.6 }, { translateY: 8 }] },
  60: { opacity: 1, transform: [{ scale: 1.18 }, { translateY: 0 }], easing: Easing.elastic(1.1) },
  100: { opacity: 1, transform: [{ scale: 1 }, { translateY: 0 }], easing: Easing.elastic(1.1) },
});

/** Full board, wrong answer: a short nudge, no drama. */
const wrongKeyframe = new Keyframe({
  0: { opacity: 0, transform: [{ translateX: 0 }] },
  25: { opacity: 1, transform: [{ translateX: -6 }] },
  50: { opacity: 1, transform: [{ translateX: 6 }] },
  75: { opacity: 1, transform: [{ translateX: -3 }] },
  100: { opacity: 1, transform: [{ translateX: 0 }] },
});

const WIN_DURATION = 700;
const WRONG_DURATION = 320;

interface StatusBannerProps {
  status: GameStatus;
  difficulty: Difficulty | undefined;
  palette: SkinPalette;
}

export function StatusBanner({ status, difficulty, palette }: StatusBannerProps) {
  let message: string;
  let color: string;
  let weight: '500' | '700' = '500';

  if (status === 'won') {
    message = '🎉 Congratulations — you solved it!';
    color = palette.entryText;
    weight = '700';
  } else if (status === 'wrong') {
    message = 'There is at least 1 error.';
    color = palette.conflictText;
    weight = '700';
  } else {
    message = difficulty ? `${DIFFICULTY_LABELS[difficulty]} puzzle` : '';
    color = palette.mutedText ?? palette.gridLine;
  }

  const entering =
    status === 'won'
      ? winKeyframe.duration(WIN_DURATION)
      : status === 'wrong'
        ? wrongKeyframe.duration(WRONG_DURATION)
        : undefined;

  return (
    <View style={{ minHeight: 28, justifyContent: 'center', alignItems: 'center' }}>
      {/* Keyed by status so each outcome replays its own entrance. */}
      <Animated.View key={status} entering={entering}>
        <Text style={{ fontSize: 16, fontWeight: weight, color }}>{message}</Text>
      </Animated.View>
    </View>
  );
}
