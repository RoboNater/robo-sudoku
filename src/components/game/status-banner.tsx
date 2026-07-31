import { Text, View } from 'react-native';

import type { Difficulty } from '@/engine/types';
import type { SkinPalette } from '@/skins/types';
import type { GameStatus } from '@/state/game-reducer';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

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
    color = palette.gridLine;
  }

  return (
    <View style={{ minHeight: 28, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 16, fontWeight: weight, color }}>{message}</Text>
    </View>
  );
}
