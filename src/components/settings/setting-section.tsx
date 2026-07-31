import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface SettingSectionProps extends ViewProps {
  title: string;
  subtitle?: string;
}

/** Titled block of related settings. */
export function SettingSection({ title, subtitle, children, style, ...rest }: SettingSectionProps) {
  return (
    <View style={[styles.section, style]} {...rest}>
      <View style={styles.heading}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {title.toUpperCase()}
        </ThemedText>
        {!!subtitle && (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
    width: '100%',
  },
  heading: {
    gap: Spacing.half,
  },
});
