/**
 * @file UrlStats.js
 * @description Quick stats row for URL detail views — clicks today, this week, this month.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Card from '../common/Card';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';
import { formatNumber } from '../../utils/formatters';

const StatBlock = ({ icon, label, value, color = COLORS.primary }) => (
  <View style={styles.statBlock}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={18} color={color} />
    </View>
    <Text style={styles.statValue}>{formatNumber(value || 0)}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const UrlStats = ({ clicksToday = 0, clicksWeek = 0, clicksMonth = 0, totalClicks = 0 }) => {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Click Statistics</Text>
      <View style={styles.row}>
        <StatBlock icon="today-outline" label="Today" value={clicksToday} color={COLORS.primary} />
        <StatBlock
          icon="calendar-outline"
          label="This Week"
          value={clicksWeek}
          color={COLORS.secondary}
        />
        <StatBlock
          icon="calendar"
          label="This Month"
          value={clicksMonth}
          color={COLORS.chartCoral}
        />
        <StatBlock icon="analytics" label="Total" value={totalClicks} color={COLORS.success} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
  },
});

export default UrlStats;
