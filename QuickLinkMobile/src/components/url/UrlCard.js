/**
 * @file UrlCard.js
 * @description URL list item card with short URL, original URL, click count, copy button, and swipe actions.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';
import { truncateUrl, formatTimeAgo, formatNumber } from '../../utils/formatters';
import { copyToClipboard } from '../../utils/helpers';
import Badge from '../common/Badge';

const UrlCard = ({ url, onPress, onDelete, onAnalytics, baseUrl = '' }) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const shortUrl = `${baseUrl}/${url.shortCode}`;
  const isActive = url.isActive !== false;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 20,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          // Swiping left — delete
          translateX.setValue(Math.max(gestureState.dx, -80));
        } else if (gestureState.dx > 0) {
          // Swiping right — analytics
          translateX.setValue(Math.min(gestureState.dx, 80));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -60) {
          // Reveal delete
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
          }).start();
        } else if (gestureState.dx > 60) {
          // Reveal analytics
          Animated.spring(translateX, {
            toValue: 80,
            useNativeDriver: true,
          }).start();
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.wrapper}>
      {/* Left swipe action — Analytics */}
      <TouchableOpacity
        style={[styles.swipeAction, styles.analyticsAction]}
        onPress={() => {
          resetSwipe();
          onAnalytics?.(url);
        }}>
        <Icon name="stats-chart" size={22} color={COLORS.white} />
        <Text style={styles.swipeText}>Analytics</Text>
      </TouchableOpacity>

      {/* Right swipe action — Delete */}
      <TouchableOpacity
        style={[styles.swipeAction, styles.deleteAction]}
        onPress={() => {
          resetSwipe();
          onDelete?.(url.shortCode);
        }}>
        <Icon name="trash-outline" size={22} color={COLORS.white} />
        <Text style={styles.swipeText}>Delete</Text>
      </TouchableOpacity>

      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}>
        <TouchableOpacity onPress={() => onPress?.(url)} activeOpacity={0.7}>
          <View style={styles.topRow}>
            <View style={styles.urlInfo}>
              <Text style={styles.shortUrl} numberOfLines={1}>
                {shortUrl}
              </Text>
              <Text style={styles.longUrl} numberOfLines={2}>
                {truncateUrl(url.longUrl, 60)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => copyToClipboard(shortUrl, 'URL Copied! 🔗')}
              style={styles.copyButton}>
              <Icon name="copy-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.statItem}>
              <Icon name="bar-chart-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.statText}>{formatNumber(url.clicks || 0)} clicks</Text>
            </View>
            <Text style={styles.timeAgo}>{formatTimeAgo(url.createdAt)}</Text>
            <Badge
              value={isActive ? 'Active' : 'Expired'}
              variant={isActive ? 'success' : 'error'}
              size="xs"
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  swipeAction: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
  },
  analyticsAction: {
    left: 0,
    backgroundColor: COLORS.info,
  },
  deleteAction: {
    right: 0,
    backgroundColor: COLORS.error,
  },
  swipeText: {
    color: COLORS.white,
    fontSize: SIZES.xs,
    marginTop: 4,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  urlInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  shortUrl: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  longUrl: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  timeAgo: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
  },
});

export default UrlCard;
