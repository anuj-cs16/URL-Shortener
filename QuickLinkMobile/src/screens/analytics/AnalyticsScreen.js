/**
 * @file AnalyticsScreen.js
 * @description Full analytics dashboard — date range, stats cards, charts, top URLs, breakdowns.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import StatsCard from '../../components/analytics/StatsCard';
import ClicksLineChart from '../../components/analytics/ClicksLineChart';
import DevicePieChart from '../../components/analytics/DevicePieChart';
import CountryBarChart from '../../components/analytics/CountryBarChart';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import useAnalytics from '../../hooks/useAnalytics';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';
import { DATE_RANGES } from '../../config/constants';
import { formatNumber } from '../../utils/formatters';

const AnalyticsScreen = ({ navigation }) => {
  const {
    dashboardStats,
    clicksData,
    deviceStats,
    browserStats,
    countryStats,
    topUrls,
    isLoading,
    fetchAllAnalytics,
  } = useAnalytics();

  const [selectedRange, setSelectedRange] = useState(7);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllAnalytics(selectedRange);
  }, [selectedRange, fetchAllAnalytics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllAnalytics(selectedRange);
    setRefreshing(false);
  };

  const stats = dashboardStats || {};
  const medals = ['🥇', '🥈', '🥉', '', ''];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }>
        {/* Header */}
        <Animatable.View animation="fadeInDown" duration={600}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Track your link performance</Text>
        </Animatable.View>

        {/* Date Range Selector */}
        <Animatable.View animation="fadeIn" duration={600} delay={100}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rangeScroll}>
            {DATE_RANGES.map((range) => (
              <TouchableOpacity
                key={range.value}
                style={[styles.rangeChip, selectedRange === range.value && styles.rangeChipActive]}
                onPress={() => setSelectedRange(range.value)}>
                <Text style={[styles.rangeText, selectedRange === range.value && styles.rangeTextActive]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animatable.View>

        {isLoading && !dashboardStats ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Stats Cards */}
            <Animatable.View animation="fadeInUp" duration={600} delay={150}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
                <StatsCard icon="link-outline" label="Total URLs" value={stats.totalUrls} color={COLORS.primary} />
                <StatsCard icon="bar-chart-outline" label="Total Clicks" value={stats.totalClicks} color={COLORS.secondary} />
                <StatsCard icon="today-outline" label="This Month" value={stats.clicksThisMonth} trend={stats.clicksTrend} color={COLORS.chartCoral} />
                <StatsCard icon="flash-outline" label="Active Links" value={stats.activeLinks} color={COLORS.success} />
              </ScrollView>
            </Animatable.View>

            {/* Clicks Chart */}
            <Animatable.View animation="fadeInUp" duration={600} delay={200}>
              <ClicksLineChart data={clicksData} title={`Clicks — Last ${selectedRange} Days`} />
            </Animatable.View>

            {/* Device Breakdown */}
            <Animatable.View animation="fadeInUp" duration={600} delay={250} style={styles.section}>
              <DevicePieChart data={deviceStats} title="Device Breakdown" />
            </Animatable.View>

            {/* Country Stats */}
            <Animatable.View animation="fadeInUp" duration={600} delay={300} style={styles.section}>
              <CountryBarChart data={countryStats} title="Top Countries" />
            </Animatable.View>

            {/* Top URLs */}
            <Animatable.View animation="fadeInUp" duration={600} delay={350} style={styles.section}>
              <Card style={styles.topCard}>
                <Text style={styles.sectionTitle}>Top URLs</Text>
                {topUrls && topUrls.length > 0 ? (
                  topUrls.slice(0, 5).map((url, index) => (
                    <TouchableOpacity
                      key={url._id || index}
                      style={styles.topUrlRow}
                      onPress={() =>
                        navigation.navigate('UrlDetail', {
                          screen: 'UrlAnalyticsScreen',
                          params: { shortCode: url.shortCode },
                        })
                      }
                      activeOpacity={0.7}>
                      <Text style={styles.topUrlRank}>{medals[index] || `${index + 1}.`}</Text>
                      <View style={styles.topUrlInfo}>
                        <Text style={styles.topUrlCode} numberOfLines={1}>{url.shortCode}</Text>
                        <Text style={styles.topUrlClicks}>{formatNumber(url.clicks || 0)} clicks</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noData}>No URL data available</Text>
                )}
              </Card>
            </Animatable.View>

            {/* Browser Breakdown */}
            <Animatable.View animation="fadeInUp" duration={600} delay={400} style={styles.section}>
              <Card style={styles.browserCard}>
                <Text style={styles.sectionTitle}>Browser Breakdown</Text>
                {browserStats && browserStats.length > 0 ? (
                  browserStats.slice(0, 5).map((item, index) => {
                    const maxCount = Math.max(...browserStats.map((b) => b.count || 0), 1);
                    const percentage = ((item.count || 0) / maxCount) * 100;
                    return (
                      <View key={index} style={styles.browserRow}>
                        <Text style={styles.browserName}>{item.browser || item._id || 'Unknown'}</Text>
                        <View style={styles.browserBarBg}>
                          <View style={[styles.browserBarFill, { width: `${percentage}%` }]} />
                        </View>
                        <Text style={styles.browserCount}>{formatNumber(item.count || 0)}</Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.noData}>No browser data available</Text>
                )}
              </Card>
            </Animatable.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.xl, paddingBottom: SPACING.huge },
  title: { fontSize: SIZES.xxxl, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.xl },
  rangeScroll: { marginBottom: SPACING.xl },
  rangeChip: {
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surface,
    marginRight: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  rangeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  rangeText: { fontSize: SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  rangeTextActive: { color: COLORS.white },
  statsScroll: { marginBottom: SPACING.xl },
  section: { marginTop: SPACING.lg },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg },
  topCard: { padding: SPACING.lg },
  topUrlRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  topUrlRank: { fontSize: 20, marginRight: SPACING.md, minWidth: 28 },
  topUrlInfo: { flex: 1 },
  topUrlCode: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.primary },
  topUrlClicks: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  browserCard: { padding: SPACING.lg },
  browserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  browserName: { fontSize: SIZES.sm, color: COLORS.textSecondary, width: 80 },
  browserBarBg: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginHorizontal: SPACING.sm, overflow: 'hidden' },
  browserBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  browserCount: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '600', minWidth: 40, textAlign: 'right' },
  noData: { fontSize: SIZES.md, color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.xxl },
});

export default AnalyticsScreen;
