/**
 * @file Card.js
 * @description Reusable card component with dark background, optional gradient, and touchable support.
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';

const Card = ({
  children,
  style,
  onPress,
  gradient,
  gradientColors,
  padding = SPACING.lg,
  shadow = true,
}) => {
  const content = gradient ? (
    <LinearGradient
      colors={gradientColors || [COLORS.gradientStart, COLORS.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { padding }, shadow && SHADOWS.medium, style]}>
      {children}
    </LinearGradient>
  ) : (
    <View style={[styles.card, { padding }, shadow && SHADOWS.small, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default Card;
