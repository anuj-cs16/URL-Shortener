/**
 * @file SignupScreen.js
 * @description Registration screen with name/email/password, password strength, and Formik+Yup validation.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { Formik } from 'formik';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import { signupSchema, checkPasswordStrength } from '../../utils/validators';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';

const SignupScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (values) => {
    setIsLoading(true);
    await register(values.name, values.email, values.password);
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animatable.View animation="fadeInDown" duration={800}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join QuickLink and start shortening URLs</Text>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" duration={800} delay={200}>
            <Formik
              initialValues={{ name: '', email: '', password: '', confirmPassword: '' }}
              validationSchema={signupSchema}
              onSubmit={handleSignup}>
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => {
                const strength = checkPasswordStrength(values.password);

                return (
                  <View style={styles.form}>
                    <Input
                      label="Full Name"
                      placeholder="John Doe"
                      value={values.name}
                      onChangeText={handleChange('name')}
                      onBlur={handleBlur('name')}
                      error={touched.name && errors.name}
                      icon="person-outline"
                      autoCapitalize="words"
                    />

                    <Input
                      label="Email"
                      placeholder="you@example.com"
                      value={values.email}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      error={touched.email && errors.email}
                      icon="mail-outline"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <Input
                      label="Password"
                      placeholder="Create a strong password"
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      error={touched.password && errors.password}
                      icon="lock-closed-outline"
                      secureTextEntry
                    />

                    {/* Password Strength Indicator */}
                    {values.password.length > 0 && (
                      <View style={styles.strengthContainer}>
                        <View style={styles.strengthBar}>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <View
                              key={level}
                              style={[
                                styles.strengthSegment,
                                {
                                  backgroundColor:
                                    level <= strength.score ? strength.color : COLORS.border,
                                },
                              ]}
                            />
                          ))}
                        </View>
                        <Text style={[styles.strengthLabel, { color: strength.color }]}>
                          {strength.label}
                        </Text>
                      </View>
                    )}

                    <Input
                      label="Confirm Password"
                      placeholder="Re-enter your password"
                      value={values.confirmPassword}
                      onChangeText={handleChange('confirmPassword')}
                      onBlur={handleBlur('confirmPassword')}
                      error={touched.confirmPassword && errors.confirmPassword}
                      icon="shield-checkmark-outline"
                      secureTextEntry
                    />

                    <Button
                      title="Create Account"
                      onPress={handleSubmit}
                      variant="primary"
                      size="lg"
                      loading={isLoading}
                      icon="person-add-outline"
                      style={styles.submitButton}
                    />
                  </View>
                );
              }}
            </Formik>

            {/* Login link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xxl,
    justifyContent: 'center',
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
    marginBottom: SPACING.xxxl,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  strengthBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    marginRight: SPACING.sm,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: SIZES.xs,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'right',
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  loginText: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: SIZES.md,
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default SignupScreen;
