/**
 * @file theme.js
 * @description Complete design system theme — colors, fonts, sizes, spacing, shadows, radii, gradients.
 *              Dark-mode-first design matching the QuickLink brand palette.
 */

export const COLORS = {
  // Primary brand
  primary: '#6C63FF',
  primaryDark: '#5A52E0',
  primaryLight: '#8B85FF',

  // Secondary accent
  secondary: '#3ECFCF',
  secondaryDark: '#2EB8B8',
  secondaryLight: '#5EDDDD',

  // Backgrounds
  background: '#0F0F1A',
  surface: '#1A1A2E',
  card: '#16213E',
  cardElevated: '#1E2A4A',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#606070',
  textInverse: '#0F0F1A',

  // Status
  success: '#4CAF50',
  successLight: 'rgba(76, 175, 80, 0.15)',
  error: '#FF5252',
  errorLight: 'rgba(255, 82, 82, 0.1)',
  warning: '#FFD93D',
  warningLight: 'rgba(255, 217, 61, 0.15)',
  info: '#29B6F6',
  infoLight: 'rgba(41, 182, 246, 0.15)',

  // Borders
  border: '#2A2A3E',
  borderLight: '#3A3A4E',
  borderFocus: '#6C63FF',

  // Base
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  // Gradients (start / end)
  gradientStart: '#6C63FF',
  gradientEnd: '#3ECFCF',
  gradientDanger: '#FF5252',
  gradientDangerEnd: '#FF8A80',

  // Tab bar
  tabBarBackground: '#1A1A2E',
  tabBarActive: '#6C63FF',
  tabBarInactive: '#606070',

  // Chart palette
  chartPurple: '#6C63FF',
  chartTeal: '#3ECFCF',
  chartCoral: '#FF6B6B',
  chartAmber: '#FFD93D',
  chartGreen: '#4CAF50',
  chartBlue: '#29B6F6',

  // Skeleton / placeholder
  skeleton: '#2A2A3E',
  skeletonHighlight: '#3A3A4E',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

export const SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  huge: 36,
  giant: 48,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  large: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const GRADIENTS = {
  primary: ['#6C63FF', '#3ECFCF'],
  danger: ['#FF5252', '#FF8A80'],
  dark: ['#1A1A2E', '#0F0F1A'],
  card: ['#1E2A4A', '#16213E'],
  success: ['#4CAF50', '#81C784'],
};
