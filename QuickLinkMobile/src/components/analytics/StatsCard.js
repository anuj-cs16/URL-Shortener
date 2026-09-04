/**
 * @file StatsCard.js
 * @description Compact analytics stat card with icon, big number, label, and trend indicator.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Card from '../common/Card';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';
import { formatNumber, formatPercentage } from '../../utils/formatters';

const StatsCard = ({ icon, label, value, trend, color = COLORS.primary, style }) => {
  const trendColor = trend > 0 ? COLORS.success : trend < 0 ? COLORS.error : COLORS.textMuted;
  const trendIcon = trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'remove';

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={20} color={color} />
        </View>
        {trend !== undefined && trend !== null && (
          <View style={[styles.trendBadge, { backgroundColor: trendColor + '20' }]}>
            <Icon name={trendIcon} size={12} color={trendColor} />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {formatPercentage(trend)}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.value}>{formatNumber(value || 0)}</Text>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.accentBar, { backgroundColor: color }]} />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    width: 150,
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  trendText: {
    fontSize: SIZES.xs,
    fontWeight: '700',
    marginLeft: 2,
  },
  value: {
    fontSize: SIZES.xxxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  label: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
});

export default StatsCard;
