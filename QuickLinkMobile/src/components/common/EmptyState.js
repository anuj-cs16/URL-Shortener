/**
 * @file EmptyState.js
 * @description Empty state placeholder with icon, title, message, and optional action button.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import { COLORS, SIZES, SPACING } from '../../config/theme';

const EmptyState = ({ icon = '📭', title, message, actionTitle, onAction }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      {title && <Text style={styles.title}>{title}</Text>}
      {message && <Text style={styles.message}>{message}</Text>}
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxxl,
    minHeight: 300,
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  button: {
    minWidth: 200,
  },
});

export default EmptyState;
