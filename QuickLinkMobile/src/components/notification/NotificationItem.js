/**
 * @file NotificationItem.js
 * @description Notification list item with type icon, bold unread title, message, and time.
 */

import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';
import { NOTIFICATION_ICONS } from '../../config/constants';
import { formatTimeAgo } from '../../utils/formatters';
import Badge from '../common/Badge';

const NotificationItem = ({ notification, onPress, onDelete }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const { type, title, message, isRead, createdAt } = notification;
  const icon = NOTIFICATION_ICONS[type] || '🔔';

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -80));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -60) {
          Animated.spring(translateX, { toValue: -80, useNativeDriver: true }).start();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.wrapper}>
      {/* Delete action */}
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          onDelete?.(notification._id);
        }}>
        <Text style={styles.deleteText}>🗑️ Delete</Text>
      </TouchableOpacity>

      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity
          style={[styles.container, !isRead && styles.unread]}
          onPress={() => onPress?.(notification)}
          activeOpacity={0.7}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, !isRead && styles.titleUnread]} numberOfLines={1}>
                {title}
              </Text>
              {!isRead && <Badge dot variant="primary" size="xs" />}
            </View>
            <Text style={styles.message} numberOfLines={2}>
              {message}
            </Text>
            <Text style={styles.time}>{formatTimeAgo(createdAt)}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  deleteText: {
    color: COLORS.white,
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  container: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unread: {
    backgroundColor: COLORS.cardElevated,
    borderColor: COLORS.primary + '30',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  icon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  titleUnread: {
    color: COLORS.text,
    fontWeight: '700',
  },
  message: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
  },
});

export default NotificationItem;
