/**
 * @file DevicePieChart.js
 * @description Pie chart for device breakdown — Desktop / Mobile / Tablet.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import Card from '../common/Card';
import { COLORS, SIZES, SPACING } from '../../config/theme';
import { formatNumber } from '../../utils/formatters';

const screenWidth = Dimensions.get('window').width;

const CHART_COLORS = [COLORS.chartPurple, COLORS.chartTeal, COLORS.chartCoral, COLORS.chartAmber, COLORS.chartGreen];

const DevicePieChart = ({ data, title = 'Device Breakdown', style }) => {
  if (!data || !data.length) {
    return (
      <Card style={[styles.card, style]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.noData}>No device data available</Text>
      </Card>
    );
  }

  const chartData = data.slice(0, 5).map((item, index) => ({
    name: item.device || item._id || item.name || 'Unknown',
    count: item.count || item.clicks || 0,
    color: CHART_COLORS[index % CHART_COLORS.length],
    legendFontColor: COLORS.textSecondary,
    legendFontSize: 12,
  }));

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>

      <PieChart
        data={chartData}
        width={screenWidth - 80}
        height={180}
        chartConfig={{
          color: () => COLORS.primary,
        }}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute={false}
      />

      {/* Custom legend with percentages */}
      <View style={styles.legend}>
        {chartData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.name}</Text>
            <Text style={styles.legendValue}>
              {formatNumber(item.count)} ({total > 0 ? ((item.count / total) * 100).toFixed(0) : 0}%)
            </Text>
          </View>
        ))}
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
    marginBottom: SPACING.md,
  },
  noData: {
    fontSize: SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.xxxl,
  },
  legend: {
    marginTop: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  legendLabel: {
    flex: 1,
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
  },
  legendValue: {
    fontSize: SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
});

export default DevicePieChart;
