/**
 * @file Badge.js
 * @description Small badge for counts and status labels with color variants.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';

const Badge = ({
  value,
  variant = 'primary',
  size = 'sm',
  dot = false,
  style,
}) => {
  const variantColors = {
    primary: { bg: COLORS.primary, text: COLORS.white },
    success: { bg: COLORS.success, text: COLORS.white },
    error: { bg: COLORS.error, text: COLORS.white },
    warning: { bg: COLORS.warning, text: COLORS.black },
    info: { bg: COLORS.info, text: COLORS.white },
    muted: { bg: COLORS.borderLight, text: COLORS.textSecondary },
  };

  const colors = variantColors[variant] || variantColors.primary;

  const sizeStyles = {
    xs: { paddingHorizontal: 4, paddingVertical: 1, fontSize: 8, minWidth: 14, height: 14 },
    sm: { paddingHorizontal: 6, paddingVertical: 2, fontSize: SIZES.xs, minWidth: 18, height: 18 },
    md: { paddingHorizontal: 8, paddingVertical: 3, fontSize: SIZES.sm, minWidth: 22, height: 22 },
    lg: { paddingHorizontal: 10, paddingVertical: 4, fontSize: SIZES.md, minWidth: 26, height: 26 },
  };

  const currentSize = sizeStyles[size] || sizeStyles.sm;

  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          {
            backgroundColor: colors.bg,
            width: size === 'xs' ? 6 : size === 'sm' ? 8 : 10,
            height: size === 'xs' ? 6 : size === 'sm' ? 8 : 10,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          minWidth: currentSize.minWidth,
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
        },
        style,
      ]}>
      <Text
        style={[
          styles.text,
          { color: colors.text, fontSize: currentSize.fontSize },
        ]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  dot: {
    borderRadius: BORDER_RADIUS.full,
  },
});

export default Badge;
