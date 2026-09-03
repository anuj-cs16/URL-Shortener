/**
 * @file Input.js
 * @description Reusable text input with floating label, error state, password toggle, and dark theme.
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  icon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoFocus = false,
  editable = true,
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, labelAnim]);

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, -8],
  });

  const labelSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SIZES.md, SIZES.xs],
  });

  const borderColor = error
    ? COLORS.error
    : isFocused
      ? COLORS.primary
      : COLORS.border;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.inputContainer,
          { borderColor },
          isFocused && styles.inputFocused,
          error && styles.inputError,
          multiline && styles.multiline,
        ]}>
        {icon && (
          <Icon
            name={icon}
            size={20}
            color={isFocused ? COLORS.primary : COLORS.textMuted}
            style={styles.leftIcon}
          />
        )}

        {label && (
          <Animated.Text
            style={[
              styles.label,
              {
                top: labelTop,
                fontSize: labelSize,
                color: error
                  ? COLORS.error
                  : isFocused
                    ? COLORS.primary
                    : COLORS.textMuted,
              },
              icon && { left: 44 },
            ]}>
            {label}
          </Animated.Text>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={isFocused ? placeholder : ''}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            icon && { paddingLeft: 0 },
            multiline && styles.multilineInput,
            inputStyle,
          ]}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}>
            <Icon
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Icon name={rightIcon} size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={14} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {maxLength && multiline && (
        <Text style={styles.charCount}>
          {value?.length || 0}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.lg,
    minHeight: 56,
    position: 'relative',
  },
  inputFocused: {
    backgroundColor: COLORS.cardElevated,
  },
  inputError: {
    backgroundColor: COLORS.errorLight,
  },
  multiline: {
    minHeight: 100,
    alignItems: 'flex-start',
    paddingTop: SPACING.md,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: SIZES.md,
    paddingVertical: SPACING.md,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  label: {
    position: 'absolute',
    left: SPACING.lg,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  rightIcon: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingLeft: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.sm,
    marginLeft: 4,
  },
  charCount: {
    color: COLORS.textMuted,
    fontSize: SIZES.xs,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
});

export default Input;
