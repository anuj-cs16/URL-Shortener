/**
 * @file SettingsScreen.js
 * @description Settings with account editing, app preferences, data management, and about info.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import useAuth from '../../hooks/useAuth';
import { showSuccess, showConfirm } from '../../utils/helpers';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';

const SettingRow = ({ label, subtitle, right }) => (
  <View style={styles.settingRow}>
    <View style={styles.settingContent}>
      <Text style={styles.settingLabel}>{label}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

const SettingsScreen = ({ navigation }) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      if (updateProfile) {
        await updateProfile(name, email);
      }
      showSuccess('Profile updated');
    } catch (err) {
      // Error handled by context
    }
    setIsSaving(false);
  };

  return (
    <View style={styles.container}>
      <Header title="Settings" onLeftPress={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <Animatable.View animation="fadeInUp" duration={600}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Card style={styles.card}>
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              icon="person-outline"
              autoCapitalize="words"
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title="Save Changes"
              onPress={handleSaveProfile}
              variant="primary"
              size="md"
              loading={isSaving}
              icon="checkmark-outline"
            />
          </Card>
        </Animatable.View>

        {/* App Preferences */}
        <Animatable.View animation="fadeInUp" duration={600} delay={100}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <Card style={styles.card}>
            <SettingRow
              label="Push Notifications"
              subtitle="Get notified about milestones"
              right={
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
                  thumbColor={pushEnabled ? COLORS.primary : COLORS.textMuted}
                />
              }
            />
            <SettingRow
              label="Biometric Login"
              subtitle="Use fingerprint or Face ID"
              right={
                <Switch
                  value={biometricEnabled}
                  onValueChange={setBiometricEnabled}
                  trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
                  thumbColor={biometricEnabled ? COLORS.primary : COLORS.textMuted}
                />
              }
            />
          </Card>
        </Animatable.View>

        {/* Data Management */}
        <Animatable.View animation="fadeInUp" duration={600} delay={200}>
          <Text style={styles.sectionTitle}>Data</Text>
          <Card style={styles.card}>
            <Button
              title="Clear Cache"
              onPress={() =>
                showConfirm('Clear Cache', 'This will clear temporary app data.', () =>
                  showSuccess('Cache cleared'),
                )
              }
              variant="ghost"
              size="sm"
              icon="trash-outline"
            />
          </Card>
        </Animatable.View>

        {/* About */}
        <Animatable.View animation="fadeInUp" duration={600} delay={300}>
          <Text style={styles.sectionTitle}>About</Text>
          <Card style={styles.card}>
            <SettingRow label="Version" right={<Text style={styles.valueText}>1.0.0</Text>} />
            <SettingRow label="Build" right={<Text style={styles.valueText}>1</Text>} />
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
  card: { padding: SPACING.lg },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  settingSubtitle: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  valueText: { fontSize: SIZES.md, color: COLORS.textSecondary },
});

export default SettingsScreen;
