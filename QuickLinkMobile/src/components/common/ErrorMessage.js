/**
 * @file ErrorMessage.js
 * @description Error display with icon, message, and optional retry button.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from './Button';
import { COLORS, SIZES, SPACING } from '../../config/theme';

const ErrorMessage = ({ message = 'Something went wrong', onRetry, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Icon name="alert-circle-outline" size={48} color={COLORS.error} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="secondary"
          size="sm"
          icon="refresh-outline"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxxl,
    minHeight: 200,
  },
  message: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  button: {
    minWidth: 140,
  },
});

export default ErrorMessage;
