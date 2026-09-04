/**
 * @file ForgotPasswordScreen.js
 * @description Placeholder forgot password screen — backend doesn't have a reset endpoint yet.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { COLORS, SIZES, SPACING } from '../../config/theme';

const ForgotPasswordScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animatable.View animation="fadeInDown" duration={800} style={styles.header}>
          <View style={styles.iconBg}>
            <Icon name="mail-unread-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={800} delay={200}>
          <Input
            label="Email Address"
            placeholder="you@example.com"
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.infoBox}>
            <Icon name="information-circle-outline" size={18} color={COLORS.info} />
            <Text style={styles.infoText}>
              Password reset via email is coming soon. For now, please contact support if you need
              to reset your password.
            </Text>
          </View>

          <Button
            title="Send Reset Link"
            onPress={() => {}}
            variant="primary"
            size="lg"
            icon="send-outline"
            disabled
            style={styles.button}
          />

          <Button
            title="Back to Login"
            onPress={() => navigation.goBack()}
            variant="ghost"
            size="md"
            icon="arrow-back"
            style={styles.backButton}
          />
        </Animatable.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xxl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  iconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: SIZES.xxxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.infoLight,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.sm,
    color: COLORS.info,
    marginLeft: SPACING.sm,
    lineHeight: 20,
  },
  button: {
    marginBottom: SPACING.lg,
  },
  backButton: {
    alignSelf: 'center',
  },
});

export default ForgotPasswordScreen;
