/**
 * @file CreateUrlScreen.js
 * @description Full URL shortening screen with form, result card, QR code, and usage indicator.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import UrlForm from '../../components/url/UrlForm';
import UrlResult from '../../components/url/UrlResult';
import useAuth from '../../hooks/useAuth';
import useUrls from '../../hooks/useUrls';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';
import { PLAN_LIMITS } from '../../config/constants';
import { formatNumber } from '../../utils/formatters';

const CreateUrlScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { createUrl, isLoading } = useUrls();
  const [result, setResult] = useState(null);

  const planId = user?.planId || 'free';
  const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;
  const urlsUsed = user?.totalUrlsCreated || 0;
  const usagePercent = limits.urlsPerMonth > 0 ? (urlsUsed / limits.urlsPerMonth) * 100 : 0;

  const handleSubmit = async (longUrl, customCode) => {
    const response = await createUrl(longUrl, customCode);
    if (response.success) {
      setResult(response.data);
    }
  };

  const handleCreateAnother = () => {
    setResult(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Animatable.View animation="fadeInDown" duration={600}>
          <Text style={styles.title}>Create Short URL</Text>
          <Text style={styles.subtitle}>Paste your long URL below</Text>
        </Animatable.View>

        {!result ? (
          <>
            {/* URL Form */}
            <Animatable.View animation="fadeInUp" duration={600} delay={100}>
              <UrlForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                planId={planId}
              />
            </Animatable.View>

            {/* Usage Indicator */}
            {limits.urlsPerMonth > 0 && (
              <Animatable.View animation="fadeInUp" duration={600} delay={200}>
                <View style={styles.usageContainer}>
                  <View style={styles.usageHeader}>
                    <Text style={styles.usageLabel}>
                      {urlsUsed} of {limits.urlsPerMonth} URLs used this month
                    </Text>
                    <Text
                      style={[
                        styles.usagePercent,
                        usagePercent > 80 && styles.usageWarning,
                      ]}>
                      {usagePercent.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.usageBar}>
                    <View
                      style={[
                        styles.usageFill,
                        {
                          width: `${Math.min(usagePercent, 100)}%`,
                          backgroundColor:
                            usagePercent > 80 ? COLORS.warning : COLORS.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              </Animatable.View>
            )}
          </>
        ) : (
          /* Result Card */
          <UrlResult
            shortUrl={result.shortUrl || `${result.shortCode}`}
            longUrl={result.longUrl}
            onCreateAnother={handleCreateAnother}
            onViewAnalytics={() => {
              navigation.navigate('UrlDetail', {
                screen: 'UrlAnalyticsScreen',
                params: { shortCode: result.shortCode },
              });
            }}
          />
        )}
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
  title: {
    fontSize: SIZES.xxxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  usageContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xl,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  usageLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  usagePercent: {
    fontSize: SIZES.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  usageWarning: {
    color: COLORS.warning,
  },
  usageBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default CreateUrlScreen;
