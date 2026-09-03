/**
 * @file helpers.js
 * @description General helper utilities — clipboard, share, haptics, platform checks.
 */

import { Platform, Alert, Linking, Vibration } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import { showMessage } from 'react-native-flash-message';
import { COLORS } from '../config/theme';

/**
 * Copy text to clipboard with haptic feedback and toast notification.
 */
export const copyToClipboard = (text, label = 'Copied!') => {
  Clipboard.setString(text);
  Vibration.vibrate(50);
  showMessage({
    message: label,
    description: text,
    type: 'success',
    backgroundColor: COLORS.success,
    color: COLORS.white,
    duration: 2000,
    icon: 'success',
  });
};

/**
 * Open native share sheet.
 */
export const shareUrl = async (url, title = 'Check out this link') => {
  try {
    await Share.open({
      title,
      message: `${title}: ${url}`,
      url,
    });
  } catch (error) {
    if (error.message !== 'User did not share') {
      showMessage({
        message: 'Share failed',
        type: 'danger',
        backgroundColor: COLORS.error,
      });
    }
  }
};

/**
 * Open URL in external browser.
 */
export const openUrl = async (url) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      showMessage({
        message: 'Cannot open URL',
        description: 'No app available to handle this URL',
        type: 'warning',
        backgroundColor: COLORS.warning,
        color: COLORS.black,
      });
    }
  } catch (error) {
    showMessage({
      message: 'Error opening URL',
      type: 'danger',
      backgroundColor: COLORS.error,
    });
  }
};

/**
 * Show success toast notification.
 */
export const showSuccess = (message, description = '') => {
  showMessage({
    message,
    description,
    type: 'success',
    backgroundColor: COLORS.success,
    color: COLORS.white,
    duration: 3000,
    icon: 'success',
  });
};

/**
 * Show error toast notification.
 */
export const showError = (message, description = '') => {
  showMessage({
    message,
    description,
    type: 'danger',
    backgroundColor: COLORS.error,
    color: COLORS.white,
    duration: 4000,
    icon: 'danger',
  });
};

/**
 * Show warning toast notification.
 */
export const showWarning = (message, description = '') => {
  showMessage({
    message,
    description,
    type: 'warning',
    backgroundColor: COLORS.warning,
    color: COLORS.black,
    duration: 3000,
    icon: 'warning',
  });
};

/**
 * Show info toast notification.
 */
export const showInfo = (message, description = '') => {
  showMessage({
    message,
    description,
    type: 'info',
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    duration: 3000,
    icon: 'info',
  });
};

/**
 * Show confirmation dialog.
 */
export const showConfirm = (title, message, onConfirm, onCancel) => {
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Confirm', style: 'destructive', onPress: onConfirm },
    ],
    { cancelable: true },
  );
};

/**
 * Get platform-specific value.
 */
export const platformSelect = (ios, android) => {
  return Platform.select({ ios, android });
};

/**
 * Check if platform is iOS.
 */
export const isIOS = Platform.OS === 'ios';

/**
 * Check if platform is Android.
 */
export const isAndroid = Platform.OS === 'android';

/**
 * Generate initials from name (e.g., "John Doe" → "JD").
 */
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Get random tip for home screen.
 */
export const getRandomTip = () => {
  const tips = [
    'Did you know? You can scan QR codes to shorten URLs instantly!',
    'Pro tip: Use custom short codes to create branded links.',
    'Track your click analytics in real-time from the Analytics tab.',
    'Share your shortened URLs directly from the result screen.',
    'Enable push notifications to get milestone alerts for your links.',
    'Upgrade to Pro for custom codes and advanced analytics.',
    'Swipe left on any URL to quickly delete it.',
    'Pull down to refresh your URL list for the latest stats.',
  ];
  return tips[Math.floor(Math.random() * tips.length)];
};

/**
 * Get flag emoji from country code.
 */
export const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};
