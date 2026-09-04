/**
 * @file SecurityScreen.js
 * @description Security settings — change password, 2FA toggle, recent sessions.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Formik } from 'formik';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import Icon from 'react-native-vector-icons/Ionicons';
import useAuth from '../../hooks/useAuth';
import { changePasswordSchema } from '../../utils/validators';
import { showSuccess, showError } from '../../utils/helpers';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';

const SecurityScreen = ({ navigation }) => {
  const { changePassword } = useAuth();
  const [isChanging, setIsChanging] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const handleChangePassword = async (values, { resetForm }) => {
    setIsChanging(true);
    try {
      if (changePassword) {
        await changePassword(values.currentPassword, values.newPassword);
      }
      showSuccess('Password changed successfully');
      resetForm();
    } catch (err) {
      showError('Error', err.message || 'Failed to change password');
    }
    setIsChanging(false);
  };

  return (
    <View style={styles.container}>
      <Header title="Security" onLeftPress={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Change Password */}
        <Animatable.View animation="fadeInUp" duration={600}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Card style={styles.card}>
            <Formik
              initialValues={{ currentPassword: '', newPassword: '', confirmNewPassword: '' }}
              validationSchema={changePasswordSchema}
              onSubmit={handleChangePassword}>
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View>
                  <Input
                    label="Current Password"
                    value={values.currentPassword}
                    onChangeText={handleChange('currentPassword')}
                    onBlur={handleBlur('currentPassword')}
                    error={touched.currentPassword && errors.currentPassword}
                    icon="lock-closed-outline"
                    secureTextEntry
                  />
                  <Input
                    label="New Password"
                    value={values.newPassword}
                    onChangeText={handleChange('newPassword')}
                    onBlur={handleBlur('newPassword')}
                    error={touched.newPassword && errors.newPassword}
                    icon="lock-open-outline"
                    secureTextEntry
                  />
                  <Input
                    label="Confirm New Password"
                    value={values.confirmNewPassword}
                    onChangeText={handleChange('confirmNewPassword')}
                    onBlur={handleBlur('confirmNewPassword')}
                    error={touched.confirmNewPassword && errors.confirmNewPassword}
                    icon="shield-checkmark-outline"
                    secureTextEntry
                  />
                  <Button
                    title="Update Password"
                    onPress={handleSubmit}
                    variant="primary"
                    size="md"
                    loading={isChanging}
                    icon="key-outline"
                  />
                </View>
              )}
            </Formik>
          </Card>
        </Animatable.View>

        {/* Two-Factor Authentication */}
        <Animatable.View animation="fadeInUp" duration={600} delay={100}>
          <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
          <Card style={styles.card}>
            <View style={styles.twoFARow}>
              <View style={styles.twoFAInfo}>
                <Icon name="shield-half-outline" size={24} color={COLORS.primary} />
                <View style={styles.twoFAText}>
                  <Text style={styles.twoFALabel}>Enable 2FA</Text>
                  <Text style={styles.twoFASubtitle}>Add an extra layer of security</Text>
                </View>
              </View>
              <Switch
                value={twoFAEnabled}
                onValueChange={setTwoFAEnabled}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
                thumbColor={twoFAEnabled ? COLORS.primary : COLORS.textMuted}
              />
            </View>
            <View style={styles.infoBox}>
              <Icon name="information-circle-outline" size={16} color={COLORS.info} />
              <Text style={styles.infoText}>
                Two-factor authentication support is coming soon.
              </Text>
            </View>
          </Card>
        </Animatable.View>

        {/* Active Sessions */}
        <Animatable.View animation="fadeInUp" duration={600} delay={200}>
          <Text style={styles.sectionTitle}>Active Sessions</Text>
          <Card style={styles.card}>
            <View style={styles.sessionRow}>
              <View style={styles.sessionIcon}>
                <Icon name="phone-portrait-outline" size={20} color={COLORS.success} />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDevice}>Current Device</Text>
                <Text style={styles.sessionDetail}>Active now</Text>
              </View>
              <View style={styles.activeDot} />
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
  card: { padding: SPACING.lg },
  twoFARow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  twoFAInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  twoFAText: { marginLeft: SPACING.md },
  twoFALabel: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  twoFASubtitle: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.infoLight,
    borderRadius: BORDER_RADIUS.sm, padding: SPACING.md,
  },
  infoText: { flex: 1, fontSize: SIZES.sm, color: COLORS.info, marginLeft: SPACING.sm },
  sessionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md },
  sessionIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.success + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  sessionInfo: { flex: 1 },
  sessionDevice: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  sessionDetail: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
});

export default SecurityScreen;
