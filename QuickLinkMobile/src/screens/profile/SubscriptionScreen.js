/**
 * @file SubscriptionScreen.js
 * @description Subscription & plan management — current plan, usage, upgrade options, payment history.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Header from '../../components/common/Header';
import useAuth from '../../hooks/useAuth';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, GRADIENTS } from '../../config/theme';
import { PLAN_LIMITS, PLAN_FEATURES } from '../../config/constants';
import { formatPlanName, getPlanEmoji, formatNumber, formatCurrency } from '../../utils/formatters';

const UsageBar = ({ label, used, limit, color = COLORS.primary }) => {
  const pct = limit > 0 ? (used / limit) * 100 : 0;

  return (
    <View style={styles.usageRow}>
      <View style={styles.usageHeader}>
        <Text style={styles.usageLabel}>{label}</Text>
        <Text style={styles.usageCount}>
          {formatNumber(used)} / {limit === Infinity || limit === -1 ? '∞' : formatNumber(limit)}
        </Text>
      </View>
      <View style={styles.usageBarBg}>
        <View
          style={[
            styles.usageBarFill,
            { width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 80 ? COLORS.warning : color },
          ]}
        />
      </View>
    </View>
  );
};

const PlanCard = ({ planId, price, isCurrentPlan, features, onSelect }) => {
  const gradient = planId === 'pro' ? GRADIENTS.primary : planId === 'business' ? GRADIENTS.success : GRADIENTS.dark;

  return (
    <Card
      gradient={planId !== 'free'}
      gradientColors={gradient}
      style={[styles.planCard, isCurrentPlan && styles.currentPlanCard]}>
      <View style={styles.planHeader}>
        <Text style={styles.planEmoji}>{getPlanEmoji(planId)}</Text>
        <Text style={[styles.planName, planId === 'free' && styles.planNameDark]}>
          {formatPlanName(planId)}
        </Text>
        {isCurrentPlan && <Badge value="Current" variant="success" size="sm" style={styles.currentBadge} />}
      </View>
      <Text style={[styles.planPrice, planId === 'free' && styles.planPriceDark]}>
        {price === 0 ? 'Free' : `${formatCurrency(price)}/mo`}
      </Text>
      {features?.map((feature, i) => (
        <View key={i} style={styles.featureRow}>
          <Icon name="checkmark-circle" size={16} color={planId === 'free' ? COLORS.success : '#fff'} />
          <Text style={[styles.featureText, planId === 'free' && styles.featureTextDark]}>{feature}</Text>
        </View>
      ))}
      {!isCurrentPlan && (
        <Button
          title={planId === 'free' ? 'Downgrade' : 'Upgrade'}
          onPress={onSelect}
          variant={planId === 'free' ? 'ghost' : 'primary'}
          size="md"
          style={styles.planButton}
        />
      )}
    </Card>
  );
};

const SubscriptionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const currentPlan = user?.planId || 'free';
  const limits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free;

  return (
    <View style={styles.container}>
      <Header title="Subscription" onLeftPress={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Current Usage */}
        <Animatable.View animation="fadeInUp" duration={600}>
          <Text style={styles.sectionTitle}>Current Usage</Text>
          <Card style={styles.usageCard}>
            <UsageBar
              label="URLs This Month"
              used={user?.urlsThisMonth || 0}
              limit={limits.urlsPerMonth || 50}
              color={COLORS.primary}
            />
            <UsageBar
              label="Custom Codes"
              used={user?.customCodesUsed || 0}
              limit={limits.customCodes || 0}
              color={COLORS.secondary}
            />
            <UsageBar
              label="API Requests"
              used={user?.apiRequestsThisMonth || 0}
              limit={limits.apiRequests || 100}
              color={COLORS.chartCoral}
            />
          </Card>
        </Animatable.View>

        {/* Plans */}
        <Animatable.View animation="fadeInUp" duration={600} delay={100}>
          <Text style={styles.sectionTitle}>Plans</Text>

          <PlanCard
            planId="free"
            price={0}
            isCurrentPlan={currentPlan === 'free'}
            features={PLAN_FEATURES?.free || ['50 URLs/month', 'Basic analytics', 'Standard support']}
            onSelect={() => {}}
          />

          <PlanCard
            planId="pro"
            price={9}
            isCurrentPlan={currentPlan === 'pro'}
            features={PLAN_FEATURES?.pro || ['500 URLs/month', 'Custom short codes', 'Advanced analytics', 'Priority support']}
            onSelect={() => {}}
          />

          <PlanCard
            planId="business"
            price={29}
            isCurrentPlan={currentPlan === 'business'}
            features={PLAN_FEATURES?.business || ['Unlimited URLs', 'Custom domains', 'Team management', 'API access', '24/7 support']}
            onSelect={() => {}}
          />
        </Animatable.View>

        {/* Payment Info */}
        <Animatable.View animation="fadeInUp" duration={600} delay={200}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Card style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Icon name="card-outline" size={24} color={COLORS.textMuted} />
              <Text style={styles.paymentText}>
                {currentPlan === 'free'
                  ? 'No payment method on file'
                  : 'Managed via Stripe'}
              </Text>
            </View>
          </Card>
        </Animatable.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.xl, paddingBottom: SPACING.huge },
  sectionTitle: {
    fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm, marginTop: SPACING.lg,
  },
  usageCard: { padding: SPACING.lg },
  usageRow: { marginBottom: SPACING.lg },
  usageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  usageLabel: { fontSize: SIZES.md, color: COLORS.textSecondary },
  usageCount: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  usageBarBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  usageBarFill: { height: '100%', borderRadius: 3 },
  planCard: { padding: SPACING.xl, marginBottom: SPACING.lg },
  currentPlanCard: { borderColor: COLORS.primary, borderWidth: 2 },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  planEmoji: { fontSize: 24, marginRight: SPACING.sm },
  planName: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.white, flex: 1 },
  planNameDark: { color: COLORS.text },
  currentBadge: { marginLeft: SPACING.sm },
  planPrice: { fontSize: SIZES.xxxl, fontWeight: '800', color: COLORS.white, marginBottom: SPACING.lg },
  planPriceDark: { color: COLORS.text },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  featureText: { fontSize: SIZES.md, color: 'rgba(255,255,255,0.9)', marginLeft: SPACING.sm },
  featureTextDark: { color: COLORS.textSecondary },
  planButton: { marginTop: SPACING.lg },
  paymentCard: { padding: SPACING.lg },
  paymentRow: { flexDirection: 'row', alignItems: 'center' },
  paymentText: { fontSize: SIZES.md, color: COLORS.textSecondary, marginLeft: SPACING.md },
});

export default SubscriptionScreen;
