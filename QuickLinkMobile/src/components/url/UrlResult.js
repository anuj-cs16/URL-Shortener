/**
 * @file UrlResult.js
 * @description Success result card shown after URL shortening — short URL, copy, share, QR code, actions.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import Card from '../common/Card';
import Button from '../common/Button';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';
import { copyToClipboard, shareUrl, openUrl } from '../../utils/helpers';

const UrlResult = ({ shortUrl, longUrl, onCreateAnother, onViewAnalytics }) => {
  if (!shortUrl) return null;

  return (
    <Animatable.View animation="fadeInUp" duration={600} delay={200}>
      <Card style={styles.card}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <Animatable.Text animation="bounceIn" delay={400} style={styles.successIcon}>
            ✅
          </Animatable.Text>
          <Text style={styles.successTitle}>URL Shortened Successfully!</Text>
        </View>

        {/* Short URL Display */}
        <View style={styles.urlDisplay}>
          <Text style={styles.shortUrlLabel}>Your Short URL</Text>
          <Text style={styles.shortUrl} selectable>
            {shortUrl}
          </Text>
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.primaryActions}>
          <Button
            title="Copy"
            onPress={() => copyToClipboard(shortUrl, 'URL Copied! 🔗')}
            variant="primary"
            size="md"
            icon="copy-outline"
            style={styles.actionButton}
          />
          <Button
            title="Share"
            onPress={() => shareUrl(shortUrl)}
            variant="secondary"
            size="md"
            icon="share-outline"
            style={styles.actionButton}
          />
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            <QRCode
              value={shortUrl}
              size={160}
              backgroundColor={COLORS.white}
              color={COLORS.black}
            />
          </View>
          <Text style={styles.qrLabel}>Scan to open</Text>
        </View>

        {/* Secondary Actions */}
        <View style={styles.secondaryActions}>
          <Button
            title="Open URL"
            onPress={() => openUrl(shortUrl)}
            variant="ghost"
            size="sm"
            icon="open-outline"
          />
          {onViewAnalytics && (
            <Button
              title="View Analytics"
              onPress={onViewAnalytics}
              variant="ghost"
              size="sm"
              icon="stats-chart-outline"
            />
          )}
        </View>

        {/* Create Another */}
        {onCreateAnother && (
          <Button
            title="Create Another"
            onPress={onCreateAnother}
            variant="secondary"
            size="md"
            icon="add-circle-outline"
            style={styles.createAnother}
          />
        )}
      </Card>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.xxl,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  successTitle: {
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  urlDisplay: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  shortUrlLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  shortUrl: {
    fontSize: SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  primaryActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    flex: 1,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  qrWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  qrLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  createAnother: {
    marginTop: SPACING.sm,
  },
});

export default UrlResult;
