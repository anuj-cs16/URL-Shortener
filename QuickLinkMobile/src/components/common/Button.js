/**
 * @file Button.js
 * @description Reusable button component with gradient, outlined, ghost, danger, and success variants.
 *              Includes loading state, haptic feedback, and press animation.
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Vibration,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    Vibration.vibrate(30);
    onPress?.();
  };

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: SIZES.sm },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: SIZES.md },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: SIZES.lg },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  const renderContent = () => (
    <View style={styles.contentRow}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? COLORS.primary : COLORS.white}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Icon
              name={icon}
              size={currentSize.fontSize + 4}
              color={
                variant === 'secondary' || variant === 'ghost' ? COLORS.primary : COLORS.white
              }
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.text,
              { fontSize: currentSize.fontSize },
              variant === 'secondary' && styles.textSecondary,
              variant === 'ghost' && styles.textGhost,
              variant === 'danger' && styles.textDanger,
              textStyle,
            ]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Icon
              name={icon}
              size={currentSize.fontSize + 4}
              color={
                variant === 'secondary' || variant === 'ghost' ? COLORS.primary : COLORS.white
              }
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          disabled={disabled || loading}>
          <LinearGradient
            colors={disabled ? ['#444', '#333'] : [COLORS.gradientStart, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.base,
              {
                paddingVertical: currentSize.paddingVertical,
                paddingHorizontal: currentSize.paddingHorizontal,
              },
              disabled && styles.disabled,
              SHADOWS.medium,
            ]}>
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={disabled || loading}
        style={[
          styles.base,
          {
            paddingVertical: currentSize.paddingVertical,
            paddingHorizontal: currentSize.paddingHorizontal,
          },
          variant === 'secondary' && styles.secondary,
          variant === 'ghost' && styles.ghost,
          variant === 'danger' && styles.danger,
          variant === 'success' && styles.success,
          disabled && styles.disabled,
        ]}>
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSecondary: {
    color: COLORS.primary,
  },
  textGhost: {
    color: COLORS.primary,
  },
  textDanger: {
    color: COLORS.white,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: COLORS.error,
  },
  success: {
    backgroundColor: COLORS.success,
  },
  disabled: {
    opacity: 0.5,
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
});

export default Button;
