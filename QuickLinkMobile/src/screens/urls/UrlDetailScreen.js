/**
 * @file UrlDetailScreen.js
 * @description URL detail view with full info, QR code, action buttons, quick stats, and analytics link.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import * as Animatable from 'react-native-animatable';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import UrlStats from '../../components/url/UrlStats';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useUrls from '../../hooks/useUrls';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';
import { formatDate, formatTimeAgo, formatNumber, truncateUrl } from '../../utils/formatters';
import { copyToClipboard, shareUrl, openUrl, showConfirm } from '../../utils/helpers';

const UrlDetailScreen = ({ route, navigation }) => {
  const urlParam = route.params?.url;
  const { getStats, deleteUrlByCode } = useUrls();
  const [urlData, setUrlData] = useState(urlParam || null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(false);

  const shortUrl = urlData?.shortUrl || `${urlData?.shortCode || ''}`;

  useEffect(() => {
    if (urlParam?.shortCode) {
      loadStats(urlParam.shortCode);
    }
  }, [urlParam]);

  const loadStats = async (shortCode) => {
    setLoading(true);
    const result = await getStats(shortCode);
    if (result.success) {
      setStatsData(result.data);
      // Merge stats into URL data
      if (result.data) {
        setUrlData((prev) => ({ ...prev, ...result.data }));
      }
    }
    setLoading(false);
  };

  const handleDelete = () => {
    showConfirm('Delete URL', 'This action cannot be undone. Delete this URL?', async () => {
      const result = await deleteUrlByCode(urlData.shortCode);
      if (result.success) {
        navigation.goBack();
      }
    });
  };

  if (!urlData) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* URL Info Card */}
      <Animatable.View animation="fadeInDown" duration={600}>
        <Card style={styles.infoCard}>
          <View style={styles.statusRow}>
            <Badge
              value={urlData.isActive !== false ? 'Active' : 'Expired'}
              variant={urlData.isActive !== false ? 'success' : 'error'}
              size="md"
            />
            <Text style={styles.clicksLarge}>
              {formatNumber(urlData.clicks || 0)} clicks
            </Text>
          </View>

          {/* Short URL */}
          <Text style={styles.shortUrlLabel}>Short URL</Text>
          <Text style={styles.shortUrl} selectable>
            {shortUrl}
          </Text>

          {/* Original URL */}
          <Text style={styles.longUrlLabel}>Original URL</Text>
          <Text style={styles.longUrl} selectable numberOfLines={4}>
            {urlData.longUrl}
          </Text>

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Icon name="calendar-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.dateText}>Created {formatDate(urlData.createdAt)}</Text>
            </View>
            {urlData.expiresAt && (
              <View style={styles.dateItem}>
                <Icon name="time-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.dateText}>Expires {formatDate(urlData.expiresAt)}</Text>
              </View>
            )}
          </View>
        </Card>
      </Animatable.View>

      {/* QR Code */}
      <Animatable.View animation="fadeInUp" duration={600} delay={100}>
        <Card style={styles.qrCard}>
          <Text style={styles.qrTitle}>QR Code</Text>
          <View style={styles.qrWrapper}>
            <QRCode
              value={shortUrl || 'https://quicklink.app'}
              size={180}
              backgroundColor={COLORS.white}
              color={COLORS.black}
            />
          </View>
        </Card>
      </Animatable.View>

      {/* Action Buttons */}
      <Animatable.View animation="fadeInUp" duration={600} delay={200}>
        <View style={styles.actions}>
          <Button
            title="Copy"
            onPress={() => copyToClipboard(shortUrl, 'URL Copied! 🔗')}
            variant="primary"
            size="md"
            icon="copy-outline"
            style={styles.actionBtn}
          />
          <Button
            title="Share"
            onPress={() => shareUrl(shortUrl)}
            variant="secondary"
            size="md"
            icon="share-outline"
            style={styles.actionBtn}
          />
        </View>
        <View style={styles.actions}>
          <Button
            title="Open"
            onPress={() => openUrl(shortUrl)}
            variant="ghost"
            size="sm"
            icon="open-outline"
            style={styles.actionBtn}
          />
          <Button
            title="Delete"
            onPress={handleDelete}
            variant="danger"
            size="sm"
            icon="trash-outline"
            style={styles.actionBtn}
          />
        </View>
      </Animatable.View>

      {/* Quick Stats */}
      <Animatable.View animation="fadeInUp" duration={600} delay={300}>
        <UrlStats
          clicksToday={statsData?.clicksToday || 0}
          clicksWeek={statsData?.clicksWeek || 0}
          clicksMonth={statsData?.clicksMonth || 0}
          totalClicks={urlData.clicks || 0}
        />
      </Animatable.View>

      {/* View Full Analytics */}
      <Animatable.View animation="fadeInUp" duration={600} delay={400}>
        <Button
          title="View Full Analytics"
          onPress={() =>
            navigation.navigate('UrlAnalyticsScreen', {
              shortCode: urlData.shortCode,
            })
          }
          variant="secondary"
          size="lg"
          icon="stats-chart-outline"
          style={styles.analyticsBtn}
        />
      </Animatable.View>
    </ScrollView>
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
  infoCard: {
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  clicksLarge: {
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  shortUrlLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  shortUrl: {
    fontSize: SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xl,
  },
  longUrlLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  longUrl: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  qrCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  qrTitle: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  qrWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  actionBtn: {
    flex: 1,
  },
  analyticsBtn: {
    marginTop: SPACING.xl,
  },
});

export default UrlDetailScreen;
