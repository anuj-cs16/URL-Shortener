/**
 * @file CountryBarChart.js
 * @description Horizontal bar chart for top countries with flag emojis.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../common/Card';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';
import { formatNumber } from '../../utils/formatters';
import { getFlagEmoji } from '../../utils/helpers';

const CountryBarChart = ({ data, title = 'Top Countries', maxItems = 5, style }) => {
  if (!data || !data.length) {
    return (
      <Card style={[styles.card, style]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.noData}>No country data available</Text>
      </Card>
    );
  }

  const items = data.slice(0, maxItems);
  const maxCount = Math.max(...items.map((item) => item.count || item.clicks || 0), 1);

  const COLORS_ARRAY = [
    COLORS.chartPurple,
    COLORS.chartTeal,
    COLORS.chartCoral,
    COLORS.chartAmber,
    COLORS.chartGreen,
  ];

  return (
    <Card style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>

      {items.map((item, index) => {
        const count = item.count || item.clicks || 0;
        const percentage = (count / maxCount) * 100;
        const color = COLORS_ARRAY[index % COLORS_ARRAY.length];
        const country = item.country || item._id || item.name || 'Unknown';
        const countryCode = item.countryCode || item.code || '';

        return (
          <View key={index} style={styles.barRow}>
            <View style={styles.labelRow}>
              <Text style={styles.flag}>{getFlagEmoji(countryCode)}</Text>
              <Text style={styles.countryName} numberOfLines={1}>
                {country}
              </Text>
              <Text style={styles.countValue}>{formatNumber(count)}</Text>
            </View>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.barFill,
                  { width: `${percentage}%`, backgroundColor: color },
                ]}
              />
            </View>
          </View>
        );
      })}
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
  noData: {
    fontSize: SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.xxxl,
  },
  barRow: {
    marginBottom: SPACING.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  flag: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  countryName: {
    flex: 1,
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
  },
  countValue: {
    fontSize: SIZES.md,
    color: COLORS.text,
    fontWeight: '700',
  },
  barBackground: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default CountryBarChart;
