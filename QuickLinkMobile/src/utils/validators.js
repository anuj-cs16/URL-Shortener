/**
 * @file validators.js
 * @description Validation utilities and Yup schemas for forms.
 */

import * as Yup from 'yup';

/**
 * Check if a string is a valid URL.
 */
export const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

/**
 * Check if a string is a valid email.
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check password strength.
 * Returns: { isValid, score, feedback }
 */
export const checkPasswordStrength = (password) => {
  if (!password) return { isValid: false, score: 0, feedback: 'Password is required' };

  let score = 0;
  const feedback = [];

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('One uppercase letter');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('One lowercase letter');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('One number');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('One special character');

  return {
    isValid: score >= 3,
    score,
    feedback: feedback.length > 0 ? `Missing: ${feedback.join(', ')}` : 'Strong password',
    label: score <= 1 ? 'Weak' : score <= 3 ? 'Medium' : score <= 4 ? 'Strong' : 'Very Strong',
    color: score <= 1 ? '#FF5252' : score <= 3 ? '#FFD93D' : '#4CAF50',
  };
};

/**
 * Validate custom short code format.
 */
export const isValidShortCode = (code) => {
  if (!code) return true;
  const codeRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return codeRegex.test(code);
};

// Yup Schemas
export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export const signupSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

export const changePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(6, 'New password must be at least 6 characters')
    .required('New password is required'),
  confirmNewPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm new password is required'),
});

export const urlSchema = Yup.object().shape({
  longUrl: Yup.string()
    .url('Please enter a valid URL')
    .required('URL is required'),
  customCode: Yup.string()
    .matches(/^[a-zA-Z0-9_-]*$/, 'Only letters, numbers, hyphens, and underscores')
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code cannot exceed 20 characters')
    .nullable(),
});
