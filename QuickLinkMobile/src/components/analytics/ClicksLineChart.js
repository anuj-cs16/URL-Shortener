/**
 * @file ClicksLineChart.js
 * @description Line chart for clicks-over-time data using react-native-chart-kit.
 */

import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Card from '../common/Card';
import { COLORS, SIZES, SPACING } from '../../config/theme';
import { formatDateShort } from '../../utils/formatters';

const screenWidth = Dimensions.get('window').width;

const ClicksLineChart = ({ data, title = 'Clicks Over Time', style }) => {
  if (!data || !data.length) {
    return (
      <Card style={[styles.card, style]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.noData}>No click data available</Text>
      </Card>
    );
  }

  // Prepare chart data — limit to 7 labels max for readability
  const step = Math.max(1, Math.floor(data.length / 7));
  const labels = data
    .filter((_, i) => i % step === 0 || i === data.length - 1)
    .map((item) => formatDateShort(item.date || item._id));
  const values = data.map((item) => item.clicks || item.count || 0);

  const chartData = {
    labels,
    datasets: [
      {
        data: values.length ? values : [0],
        color: () => COLORS.primary,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <Card style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={chartData}
        width={screenWidth - 80}
        height={200}
        chartConfig={{
          backgroundColor: COLORS.card,
          backgroundGradientFrom: COLORS.card,
          backgroundGradientTo: COLORS.card,
          decimalCount: 0,
          color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
          labelColor: () => COLORS.textMuted,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: COLORS.primary,
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: COLORS.border,
            strokeWidth: 0.5,
          },
        }}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withHorizontalLabels={true}
        withVerticalLabels={true}
        fromZero
      />
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
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  noData: {
    fontSize: SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.xxxl,
  },
});

export default ClicksLineChart;
