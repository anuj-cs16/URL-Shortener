/**
 * @file UrlAnalyticsScreen.js
 * @description Per-URL analytics view — same layout as AnalyticsScreen but scoped to a single shortCode.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import ClicksLineChart from '../../components/analytics/ClicksLineChart';
import DevicePieChart from '../../components/analytics/DevicePieChart';
import CountryBarChart from '../../components/analytics/CountryBarChart';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import useAnalytics from '../../hooks/useAnalytics';
import { COLORS, SIZES, SPACING } from '../../config/theme';
import { formatNumber, formatDate } from '../../utils/formatters';

const UrlAnalyticsScreen = ({ route }) => {
  const shortCode = route.params?.shortCode;
  const { urlAnalytics, isLoading, error, fetchUrlAnalytics } = useAnalytics();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (shortCode) {
      fetchUrlAnalytics(shortCode);
    }
  }, [shortCode, fetchUrlAnalytics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUrlAnalytics(shortCode);
    setRefreshing(false);
  };

  if (error) {
    return <ErrorMessage message={error} onRetry={() => fetchUrlAnalytics(shortCode)} />;
  }

  if (isLoading && !urlAnalytics) {
    return <LoadingSpinner fullScreen message="Loading analytics..." />;
  }

  const data = urlAnalytics || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }>
      {/* URL Header */}
      <Animatable.View animation="fadeInDown" duration={600}>
        <Card style={styles.headerCard}>
          <Text style={styles.shortCode}>{shortCode}</Text>
          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{formatNumber(data.totalClicks || 0)}</Text>
              <Text style={styles.headerStatLabel}>Total Clicks</Text>
            </View>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{formatNumber(data.clicksToday || 0)}</Text>
              <Text style={styles.headerStatLabel}>Today</Text>
            </View>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{formatNumber(data.uniqueClicks || 0)}</Text>
              <Text style={styles.headerStatLabel}>Unique</Text>
            </View>
          </View>
        </Card>
      </Animatable.View>

      {/* Clicks Over Time */}
      <Animatable.View animation="fadeInUp" duration={600} delay={100} style={styles.section}>
        <ClicksLineChart data={data.clicksOverTime} title="Clicks Over Time" />
      </Animatable.View>

      {/* Devices */}
      <Animatable.View animation="fadeInUp" duration={600} delay={200} style={styles.section}>
        <DevicePieChart data={data.devices} title="Devices" />
      </Animatable.View>

      {/* Countries */}
      <Animatable.View animation="fadeInUp" duration={600} delay={300} style={styles.section}>
        <CountryBarChart data={data.countries} title="Countries" />
      </Animatable.View>

      {/* Browsers */}
      {data.browsers && data.browsers.length > 0 && (
        <Animatable.View animation="fadeInUp" duration={600} delay={400} style={styles.section}>
          <Card style={styles.browserCard}>
            <Text style={styles.sectionTitle}>Browsers</Text>
            {data.browsers.slice(0, 5).map((item, index) => {
              const maxCount = Math.max(...data.browsers.map((b) => b.count || 0), 1);
              const pct = ((item.count || 0) / maxCount) * 100;
              return (
                <View key={index} style={styles.browserRow}>
                  <Text style={styles.browserName}>{item.browser || item._id || 'Unknown'}</Text>
                  <View style={styles.browserBarBg}>
                    <View style={[styles.browserBarFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.browserCount}>{formatNumber(item.count || 0)}</Text>
                </View>
              );
            })}
          </Card>
        </Animatable.View>
      )}

      {/* Recent Clicks */}
      {data.recentClicks && data.recentClicks.length > 0 && (
        <Animatable.View animation="fadeInUp" duration={600} delay={500} style={styles.section}>
          <Card style={styles.recentCard}>
            <Text style={styles.sectionTitle}>Recent Clicks</Text>
            {data.recentClicks.slice(0, 5).map((click, index) => (
              <View key={index} style={styles.clickRow}>
                <Text style={styles.clickTime}>{formatDate(click.timestamp || click.createdAt)}</Text>
                <Text style={styles.clickCountry}>{click.country || 'Unknown'}</Text>
                <Badge value={click.device || click.deviceType || 'Desktop'} variant="muted" size="xs" />
              </View>
            ))}
          </Card>
        </Animatable.View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.xl, paddingBottom: SPACING.huge },
  headerCard: { padding: SPACING.xl, marginBottom: SPACING.lg },
  shortCode: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.lg, textAlign: 'center' },
  headerStats: { flexDirection: 'row', justifyContent: 'space-around' },
  headerStat: { alignItems: 'center' },
  headerStatValue: { fontSize: SIZES.xxxl, fontWeight: '800', color: COLORS.text },
  headerStatLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  section: { marginTop: SPACING.lg },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg },
  browserCard: { padding: SPACING.lg },
  browserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  browserName: { fontSize: SIZES.sm, color: COLORS.textSecondary, width: 80 },
  browserBarBg: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginHorizontal: SPACING.sm, overflow: 'hidden' },
  browserBarFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 3 },
  browserCount: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '600', minWidth: 40, textAlign: 'right' },
  recentCard: { padding: SPACING.lg },
  clickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  clickTime: { fontSize: SIZES.sm, color: COLORS.textSecondary, flex: 1 },
  clickCountry: { fontSize: SIZES.sm, color: COLORS.text, marginRight: SPACING.sm },
});

export default UrlAnalyticsScreen;
