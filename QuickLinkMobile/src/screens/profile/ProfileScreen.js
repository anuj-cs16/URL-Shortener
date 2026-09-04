/**
 * @file ProfileScreen.js
 * @description Profile overview with avatar, user info, plan badge, stats row, and menu items.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import useAuth from '../../hooks/useAuth';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, GRADIENTS, SHADOWS } from '../../config/theme';
import { getInitials } from '../../utils/helpers';
import { formatNumber, formatPlanName, getPlanEmoji, formatDate } from '../../utils/formatters';

const MenuItem = ({ icon, label, subtitle, onPress, danger = false, rightComponent }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Icon name={icon} size={20} color={danger ? COLORS.error : COLORS.primary} />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {rightComponent || (
      <Icon name="chevron-forward" size={18} color={COLORS.textMuted} />
    )}
  </TouchableOpacity>
);

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const planId = user?.planId || 'free';

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <Animatable.View animation="fadeInDown" duration={600}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planEmoji}>{getPlanEmoji(planId)}</Text>
              <Text style={styles.planText}>{formatPlanName(planId)} Plan</Text>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Stats Row */}
        <Animatable.View animation="fadeInUp" duration={600} delay={100}>
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(user?.totalUrlsCreated || 0)}</Text>
                <Text style={styles.statLabel}>URLs Created</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(user?.totalClicks || 0)}</Text>
                <Text style={styles.statLabel}>Total Clicks</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatDate(user?.createdAt) || 'N/A'}</Text>
                <Text style={styles.statLabel}>Member Since</Text>
              </View>
            </View>
          </Card>
        </Animatable.View>

        {/* Menu Items */}
        <Animatable.View animation="fadeInUp" duration={600} delay={200}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              label="Edit Profile"
              subtitle="Name, email"
              onPress={() => navigation.navigate('SettingsScreen')}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Security"
              subtitle="Password, 2FA"
              onPress={() => navigation.navigate('SecurityScreen')}
            />
            <MenuItem
              icon="diamond-outline"
              label="Subscription"
              subtitle={`${formatPlanName(planId)} plan`}
              onPress={() => navigation.navigate('SubscriptionScreen')}
            />
          </Card>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={600} delay={300}>
          <Text style={styles.sectionTitle}>App</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="settings-outline"
              label="Settings"
              subtitle="Preferences, notifications"
              onPress={() => navigation.navigate('SettingsScreen')}
            />
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => {}}
            />
            <MenuItem
              icon="information-circle-outline"
              label="About"
              subtitle="Version 1.0.0"
              onPress={() => {}}
            />
          </Card>
        </Animatable.View>

        {/* Logout */}
        <Animatable.View animation="fadeInUp" duration={600} delay={400}>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleLogout}
              danger
            />
          </Card>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: SPACING.huge },
  profileHeader: {
    padding: SPACING.xxl,
    paddingTop: SPACING.xxxl,
    alignItems: 'center',
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    marginBottom: -SPACING.xl,
    paddingBottom: SPACING.xxxl + SPACING.xl,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontSize: SIZES.xxxl, fontWeight: '800', color: COLORS.white },
  userName: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.white },
  userEmail: { fontSize: SIZES.md, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  planBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
  },
  planEmoji: { fontSize: 16, marginRight: 6 },
  planText: { fontSize: SIZES.sm, color: COLORS.white, fontWeight: '600' },
  statsCard: { marginHorizontal: SPACING.xl, marginBottom: SPACING.xl, padding: SPACING.xl },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  sectionTitle: {
    fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginHorizontal: SPACING.xl, marginBottom: SPACING.sm, marginTop: SPACING.md,
  },
  menuCard: { marginHorizontal: SPACING.xl, padding: 0, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  menuIconDanger: { backgroundColor: COLORS.error + '15' },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  menuLabelDanger: { color: COLORS.error },
  menuSubtitle: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
});

export default ProfileScreen;
