/**
 * @file HomeScreen.js
 * @description Dashboard home with greeting, quick stats, action buttons, recent URLs, and tips.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useAuth from '../../hooks/useAuth';
import useUrls from '../../hooks/useUrls';
import useAnalytics from '../../hooks/useAnalytics';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, GRADIENTS, SHADOWS } from '../../config/theme';
import { getGreeting, getCurrentDateFormatted } from '../../utils/formatters';
import { formatNumber, formatTimeAgo, truncateUrl } from '../../utils/formatters';
import { copyToClipboard, getRandomTip } from '../../utils/helpers';

const QuickAction = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={24} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const MiniUrlCard = ({ url, onPress }) => (
  <TouchableOpacity style={styles.miniCard} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.miniCardContent}>
      <Text style={styles.miniShortUrl} numberOfLines={1}>
        {url.shortCode}
      </Text>
      <Text style={styles.miniLongUrl} numberOfLines={1}>
        {truncateUrl(url.longUrl, 35)}
      </Text>
    </View>
    <View style={styles.miniStats}>
      <Icon name="bar-chart-outline" size={12} color={COLORS.textMuted} />
      <Text style={styles.miniClicks}>{formatNumber(url.clicks || 0)}</Text>
    </View>
    <Text style={styles.miniTime}>{formatTimeAgo(url.createdAt)}</Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { urls, fetchUrls, isLoading: urlsLoading } = useUrls();
  const { dashboardStats, fetchDashboard, isLoading: statsLoading } = useAnalytics();
  const [refreshing, setRefreshing] = React.useState(false);
  const tip = React.useMemo(() => getRandomTip(), []);

  useEffect(() => {
    fetchUrls();
    fetchDashboard();
  }, [fetchUrls, fetchDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUrls(true), fetchDashboard()]);
    setRefreshing(false);
  }, [fetchUrls, fetchDashboard]);

  const recentUrls = urls.slice(0, 5);
  const stats = dashboardStats || {};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }>
        {/* Greeting Header */}
        <Animatable.View animation="fadeInDown" duration={600}>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greeting}>
                {getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
              </Text>
              <Text style={styles.date}>{getCurrentDateFormatted()}</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('UrlDetail', { screen: 'NotificationsScreen' })}>
              <Icon name="notifications-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Quick Stats */}
        <Animatable.View animation="fadeInUp" duration={600} delay={100}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {formatNumber(stats.totalUrls || user?.totalUrlsCreated || 0)}
                </Text>
                <Text style={styles.statLabel}>Total URLs</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {formatNumber(stats.totalClicks || 0)}
                </Text>
                <Text style={styles.statLabel}>Total Clicks</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {formatNumber(stats.activeLinks || 0)}
                </Text>
                <Text style={styles.statLabel}>Active Links</Text>
              </View>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Quick Actions */}
        <Animatable.View animation="fadeInUp" duration={600} delay={200}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickAction
              icon="link-outline"
              label="Shorten"
              color={COLORS.primary}
              onPress={() => navigation.navigate('Create')}
            />
            <QuickAction
              icon="qr-code-outline"
              label="Scan QR"
              color={COLORS.secondary}
              onPress={() =>
                navigation.navigate('UrlDetail', { screen: 'ScannerScreen' })
              }
            />
            <QuickAction
              icon="stats-chart-outline"
              label="Analytics"
              color={COLORS.chartCoral}
              onPress={() => navigation.navigate('Analytics')}
            />
            <QuickAction
              icon="notifications-outline"
              label="Alerts"
              color={COLORS.warning}
              onPress={() =>
                navigation.navigate('UrlDetail', { screen: 'NotificationsScreen' })
              }
            />
          </View>
        </Animatable.View>

        {/* Recent URLs */}
        <Animatable.View animation="fadeInUp" duration={600} delay={300}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent URLs</Text>
            {urls.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('URLs')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {urlsLoading && !urls.length ? (
            <LoadingSpinner />
          ) : recentUrls.length > 0 ? (
            recentUrls.map((url, index) => (
              <MiniUrlCard
                key={url._id || index}
                url={url}
                onPress={() =>
                  navigation.navigate('UrlDetail', {
                    screen: 'UrlDetailScreen',
                    params: { url },
                  })
                }
              />
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔗</Text>
              <Text style={styles.emptyText}>No URLs yet. Create your first one!</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Create')}>
                <Text style={styles.emptyButtonText}>Shorten a URL</Text>
              </TouchableOpacity>
            </Card>
          )}
        </Animatable.View>

        {/* Quick Tip */}
        <Animatable.View animation="fadeInUp" duration={600} delay={400}>
          <Card style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipTitle}>Quick Tip</Text>
            </View>
            <Text style={styles.tipText}>{tip}</Text>
          </Card>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  greeting: {
    fontSize: SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  date: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Stats card
  statsCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xxl,
    ...SHADOWS.large,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: SIZES.xxxl,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  // Quick actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxl,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  viewAll: {
    fontSize: SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.lg,
  },
  // Mini URL cards
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  miniCardContent: {
    flex: 1,
  },
  miniShortUrl: {
    fontSize: SIZES.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  miniLongUrl: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  miniStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  miniClicks: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: '600',
  },
  miniTime: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
  },
  // Empty state
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  emptyButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: SIZES.sm,
  },
  // Tip card
  tipCard: {
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  tipTitle: {
    fontSize: SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  tipText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default HomeScreen;
