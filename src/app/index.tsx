import { useSettings } from '@/state/settings-context';
import { getUI } from '@/uis';
import { ActiveUiProvider } from '@/uis/ui-context';

export default function GameScreen() {
  const { activeUiId } = useSettings();
  const ui = getUI(activeUiId);
  const ActiveUI = ui.component;

  return (
    <ActiveUiProvider ui={ui}>
      <ActiveUI />
    </ActiveUiProvider>
  );
}
