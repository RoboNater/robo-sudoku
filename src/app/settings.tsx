import { Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OptionRow } from '@/components/settings/option-row';
import { SettingSection } from '@/components/settings/setting-section';
import { SkinPicker } from '@/components/settings/skin-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSettings } from '@/state/settings-context';
import { getUI, listUIs } from '@/uis';

export default function SettingsScreen() {
  const settings = useSettings();

  const activeUi = getUI(settings.activeUiId);
  const chosen = settings.perUi[activeUi.id] ?? {};
  const skins = activeUi.skins ? Object.values(activeUi.skins) : [];
  const layouts = activeUi.layouts ? Object.values(activeUi.layouts) : [];

  // Fall back the same way the UI itself does, so the picker always highlights
  // whatever is actually on screen.
  const selectedSkinId =
    (chosen.skinId && activeUi.skins?.[chosen.skinId]?.id) ?? activeUi.defaultSkinId ?? skins[0]?.id;
  const selectedLayoutId =
    (chosen.layoutId && activeUi.layouts?.[chosen.layoutId]?.id) ??
    activeUi.defaultLayoutId ??
    layouts[0]?.id;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}>
          <ThemedText type="subtitle">Settings</ThemedText>

          <SettingSection title="Game UI" subtitle="Switching keeps the puzzle you are on.">
            {listUIs().map((ui) => (
              <OptionRow
                key={ui.id}
                label={ui.name}
                description={ui.description}
                selected={ui.id === activeUi.id}
                onPress={() => settings.setActiveUi(ui.id)}
              />
            ))}
          </SettingSection>

          {skins.length > 1 && (
            <SettingSection title={`${activeUi.name} skin`}>
              <SkinPicker
                skins={skins}
                selectedId={selectedSkinId ?? ''}
                onSelect={(skinId) => settings.setSkin(activeUi.id, skinId)}
              />
            </SettingSection>
          )}

          {layouts.length > 1 && (
            <SettingSection title={`${activeUi.name} layout`}>
              {layouts.map((layout) => (
                <OptionRow
                  key={layout.id}
                  label={layout.name}
                  description={layout.description}
                  selected={layout.id === selectedLayoutId}
                  onPress={() => settings.setLayout(activeUi.id, layout.id)}
                />
              ))}
            </SettingSection>
          )}

          <SettingSection title="Gameplay">
            <ThemedView type="backgroundElement" style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <ThemedText type="smallBold">Show errors</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Highlight conflicting digits in red while you play.
                </ThemedText>
              </View>
              <Switch value={settings.showErrors} onValueChange={settings.setShowErrors} />
            </ThemedView>
          </SettingSection>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'web' ? 72 : Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.four,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  toggleText: {
    flex: 1,
    gap: Spacing.half,
  },
});
