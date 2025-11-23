/**
 * PHASE 4: Comprehensive Theme System
 * Light and Dark mode color palettes with full app styling
 * 
 * Light Mode: Clean, professional, easy on the eyes
 * Dark Mode: Easy on the eyes in low-light conditions
 * 
 * Use with: const { colors } = useThemeColors();
 */

import { Platform } from 'react-native';

const tintColorLight = '#007AFF';
const tintColorDark = '#64B5F6';

/**
 * PHASE 4: Extended Color System
 * Comprehensive colors for all UI components
 */
export const Colors = {
  light: {
    // Primary Colors
    primary: '#007AFF',
    primaryLight: '#E3F2FD',
    primaryDark: '#0051BA',
    
    // Secondary Colors
    secondary: '#17A2B8',
    secondaryLight: '#E0F7FA',
    secondaryDark: '#00838F',
    
    // Accent Colors
    accent: '#FF6B6B',
    accentLight: '#FFE0E0',
    accentDark: '#E63946',
    
    // Status Colors
    success: '#27AE60',
    successLight: '#D4EDDA',
    successDark: '#1E8449',
    
    warning: '#F39C12',
    warningLight: '#FFF3CD',
    warningDark: '#E67E22',
    
    error: '#E74C3C',
    errorLight: '#F8D7DA',
    errorDark: '#C0392B',
    
    info: '#3498DB',
    infoLight: '#D1ECF1',
    infoDark: '#0C5460',
    
    // Neutral Colors
    text: '#1F2937',
    textLight: '#6B7280',
    textLighter: '#9CA3AF',
    textLightest: '#D1D5DB',
    
    background: '#FFFFFF',
    backgroundAlt: '#F9FAFB',
    backgroundAlt2: '#F3F4F6',
    
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    
    divider: '#E5E7EB',
    
    // Tint
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    
    // Shadow
    shadow: '#000000',
    
    // Transparency
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    // Primary Colors
    primary: '#64B5F6',
    primaryLight: '#1565C0',
    primaryDark: '#90CAF9',
    
    // Secondary Colors
    secondary: '#4DD0E1',
    secondaryLight: '#00838F',
    secondaryDark: '#80DEEA',
    
    // Accent Colors
    accent: '#FF7070',
    accentLight: '#D32F2F',
    accentDark: '#FF8A80',
    
    // Status Colors
    success: '#4CAF50',
    successLight: '#1B5E20',
    successDark: '#81C784',
    
    warning: '#FFA726',
    warningLight: '#E65100',
    warningDark: '#FFB74D',
    
    error: '#EF5350',
    errorLight: '#B71C1C',
    errorDark: '#EF9A9A',
    
    info: '#42A5F5',
    infoLight: '#01579B',
    infoDark: '#64B5F6',
    
    // Neutral Colors
    text: '#F3F4F6',
    textLight: '#D1D5DB',
    textLighter: '#9CA3AF',
    textLightest: '#6B7280',
    
    background: '#121212',
    backgroundAlt: '#1E1E1E',
    backgroundAlt2: '#2A2A2A',
    
    border: '#424242',
    borderLight: '#2A2A2A',
    borderDark: '#616161',
    
    divider: '#424242',
    
    // Tint
    tint: tintColorDark,
    icon: '#B0BEC5',
    tabIconDefault: '#B0BEC5',
    tabIconSelected: tintColorDark,
    
    // Shadow
    shadow: '#000000',
    
    // Transparency
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
