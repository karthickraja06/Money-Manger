/**
 * Dark Mode Settings Screen - Phase 4
 * Manage app theme preferences
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Appearance,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function ThemeSettingsScreen() {
  const { isDarkMode, toggleTheme, setTheme, colors, colorScheme } = useTheme();
  const [useSystemTheme, setUseSystemTheme] = useState(false);

  const handleToggleDarkMode = () => {
    toggleTheme();
  };

  const handleUseSystemTheme = async (value: boolean) => {
    setUseSystemTheme(value);
    if (value) {
      // Use system preference
      const systemTheme = Appearance.getColorScheme() ?? 'light';
      await setTheme(systemTheme === 'dark');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>🌓 Appearance</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>
            Customize your app theme
          </Text>
        </View>

        {/* Current Theme Display */}
        <View style={[styles.themeDisplayCard, { backgroundColor: colors.backgroundAlt }]}>
          <View style={styles.themeDisplayContent}>
            <Text style={[styles.themeDisplayLabel, { color: colors.textLight }]}>
              Current Theme
            </Text>
            <Text style={[styles.themeDisplayValue, { color: colors.primary }]}>
              {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </Text>
          </View>
          <View
            style={[
              styles.themeIndicator,
              {
                backgroundColor: isDarkMode ? colors.primary : colors.warning,
              },
            ]}
          />
        </View>

        {/* Theme Options */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme Options</Text>

          {/* Dark Mode Toggle */}
          <View
            style={[
              styles.optionRow,
              { borderBottomColor: colors.border },
            ]}
          >
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>🌙 Dark Mode</Text>
              <Text style={[styles.optionDescription, { color: colors.textLight }]}>
                Use dark theme for easier viewing in low light
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDarkMode ? colors.primaryLight : colors.textLighter}
            />
          </View>

          {/* Use System Theme */}
          <View style={styles.optionRow}>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                🔄 Use System Theme
              </Text>
              <Text style={[styles.optionDescription, { color: colors.textLight }]}>
                Follow device light/dark mode settings
              </Text>
            </View>
            <Switch
              value={useSystemTheme}
              onValueChange={handleUseSystemTheme}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={useSystemTheme ? colors.secondaryLight : colors.textLighter}
            />
          </View>
        </View>

        {/* Color Palette Preview */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Color Palette</Text>

          {/* Primary Colors */}
          <View style={styles.colorGroup}>
            <Text style={[styles.colorGroupLabel, { color: colors.textLight }]}>
              Primary Colors
            </Text>
            <View style={styles.colorRow}>
              <ColorSwatch color={colors.primary} label="Primary" />
              <ColorSwatch color={colors.primaryLight} label="Light" />
              <ColorSwatch color={colors.primaryDark} label="Dark" />
            </View>
          </View>

          {/* Status Colors */}
          <View style={styles.colorGroup}>
            <Text style={[styles.colorGroupLabel, { color: colors.textLight }]}>
              Status Colors
            </Text>
            <View style={styles.colorRow}>
              <ColorSwatch color={colors.success} label="Success" size="small" />
              <ColorSwatch color={colors.warning} label="Warning" size="small" />
              <ColorSwatch color={colors.error} label="Error" size="small" />
              <ColorSwatch color={colors.info} label="Info" size="small" />
            </View>
          </View>

          {/* Neutral Colors */}
          <View style={styles.colorGroup}>
            <Text style={[styles.colorGroupLabel, { color: colors.textLight }]}>
              Neutral Colors
            </Text>
            <View style={styles.colorRow}>
              <ColorSwatch color={colors.text} label="Text" size="small" />
              <ColorSwatch color={colors.textLight} label="Light" size="small" />
              <ColorSwatch color={colors.border} label="Border" size="small" />
              <ColorSwatch color={colors.background} label="BG" size="small" hasBorder />
            </View>
          </View>
        </View>

        {/* Theme Details */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme Details</Text>

          <DetailRow label="Mode" value={isDarkMode ? 'Dark' : 'Light'} colors={colors} />
          <DetailRow label="Color Scheme" value={colorScheme} colors={colors} />
          <DetailRow label="Contrast" value="High" colors={colors} />
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.infoLight }]}>
          <Text style={[styles.infoText, { color: colors.info }]}>
            💡 Tip: Dark mode helps reduce eye strain in low-light environments. Toggle the Dark
            Mode switch to see changes immediately throughout the app.
          </Text>
        </View>

        {/* Sample Components */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sample Components</Text>

          <TouchableOpacity
            style={[
              styles.sampleButton,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primaryDark,
              },
            ]}
          >
            <Text style={[styles.sampleButtonText, { color: colors.background }]}>
              Primary Button
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sampleButton,
              {
                backgroundColor: colors.backgroundAlt,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.sampleButtonText, { color: colors.text }]}>
              Secondary Button
            </Text>
          </TouchableOpacity>

          <View style={[styles.sampleCard, { backgroundColor: colors.backgroundAlt }]}>
            <Text style={[styles.sampleCardTitle, { color: colors.text }]}>Sample Card</Text>
            <Text style={[styles.sampleCardText, { color: colors.textLight }]}>
              This is how text looks in the current theme
            </Text>
          </View>
        </View>

        {/* Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface ColorSwatchProps {
  color: string;
  label: string;
  size?: 'large' | 'small';
  hasBorder?: boolean;
}

function ColorSwatch({ color, label, size = 'large', hasBorder }: ColorSwatchProps) {
  const sizeStyle = size === 'small' ? styles.colorSwatchSmall : styles.colorSwatchLarge;

  return (
    <View style={styles.colorSwatchContainer}>
      <View
        style={[
          sizeStyle,
          {
            backgroundColor: color,
            borderWidth: hasBorder ? 1 : 0,
            borderColor: '#999',
          },
        ]}
      />
      <Text style={styles.colorSwatchLabel}>{label}</Text>
    </View>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  colors: any;
}

function DetailRow({ label, value, colors }: DetailRowProps) {
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.textLight }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  themeDisplayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  themeDisplayContent: {
    flex: 1,
  },
  themeDisplayLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  themeDisplayValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  themeIndicator: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginLeft: 16,
  },
  section: {
    borderTopWidth: 8,
    marginTop: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  optionContent: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
  },
  colorGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  colorGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  colorSwatchContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  colorSwatchLarge: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  colorSwatchSmall: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginBottom: 6,
  },
  colorSwatchLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#999',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  sampleButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  sampleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sampleCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
  },
  sampleCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sampleCardText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
