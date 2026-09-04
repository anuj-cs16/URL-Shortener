/**
 * @file UrlForm.js
 * @description URL shortening form with clipboard paste, URL validation, and custom code input.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/Ionicons';
import Input from '../common/Input';
import Button from '../common/Button';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';
import { isValidUrl } from '../../utils/validators';

const UrlForm = ({ onSubmit, isLoading = false, planId = 'free' }) => {
  const [longUrl, setLongUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [urlValid, setUrlValid] = useState(null); // null = not checked, true/false
  const [clipboardUrl, setClipboardUrl] = useState(null);

  const isPro = planId === 'pro' || planId === 'business';

  // Check clipboard for URL on mount
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await Clipboard.getString();
        if (text && isValidUrl(text)) {
          setClipboardUrl(text);
        }
      } catch (e) {
        // Clipboard access may fail silently
      }
    };
    checkClipboard();
  }, []);

  const handleUrlChange = (text) => {
    setLongUrl(text);
    if (text.length > 5) {
      setUrlValid(isValidUrl(text));
    } else {
      setUrlValid(null);
    }
  };

  const handlePaste = async () => {
    if (clipboardUrl) {
      setLongUrl(clipboardUrl);
      setUrlValid(true);
      setClipboardUrl(null);
    } else {
      try {
        const text = await Clipboard.getString();
        if (text) {
          setLongUrl(text);
          setUrlValid(isValidUrl(text));
        }
      } catch (e) {
        // Ignore
      }
    }
  };

  const handleSubmit = () => {
    if (!longUrl || !isValidUrl(longUrl)) return;
    onSubmit(longUrl, useCustomCode && customCode ? customCode : null);
  };

  const canSubmit = longUrl && urlValid && !isLoading;

  return (
    <View style={styles.container}>
      {/* Clipboard suggestion */}
      {clipboardUrl && (
        <TouchableOpacity style={styles.clipboardBanner} onPress={handlePaste}>
          <Icon name="clipboard-outline" size={18} color={COLORS.primary} />
          <Text style={styles.clipboardText} numberOfLines={1}>
            Paste: {clipboardUrl}
          </Text>
          <Icon name="arrow-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      {/* URL Input */}
      <View style={styles.inputWrapper}>
        <Input
          label="Long URL"
          placeholder="https://example.com/very/long/url"
          value={longUrl}
          onChangeText={handleUrlChange}
          icon="link-outline"
          keyboardType="url"
          autoCapitalize="none"
          rightIcon="clipboard-outline"
          onRightIconPress={handlePaste}
          error={urlValid === false ? 'Please enter a valid URL' : undefined}
        />
        {urlValid === true && (
          <View style={styles.validIndicator}>
            <Icon name="checkmark-circle" size={20} color={COLORS.success} />
          </View>
        )}
      </View>

      {/* Custom Code Section */}
      <TouchableOpacity
        style={styles.customCodeToggle}
        onPress={() => isPro && setUseCustomCode(!useCustomCode)}
        activeOpacity={isPro ? 0.7 : 1}>
        <View style={styles.toggleRow}>
          <Icon
            name={useCustomCode ? 'checkbox' : 'square-outline'}
            size={22}
            color={isPro ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.toggleLabel, !isPro && styles.toggleDisabled]}>
            Use custom code
          </Text>
          {!isPro && (
            <View style={styles.proBadge}>
              <Icon name="lock-closed" size={12} color={COLORS.warning} />
              <Text style={styles.proText}>PRO</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {useCustomCode && isPro && (
        <Input
          label="Custom Short Code"
          placeholder="my-custom-code"
          value={customCode}
          onChangeText={setCustomCode}
          icon="code-outline"
          autoCapitalize="none"
        />
      )}

      {/* Submit Button */}
      <Button
        title="Shorten URL 🔗"
        onPress={handleSubmit}
        variant="primary"
        size="lg"
        loading={isLoading}
        disabled={!canSubmit}
        icon="flash-outline"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
  },
  clipboardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '15',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  clipboardText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: SIZES.sm,
    marginHorizontal: SPACING.sm,
  },
  inputWrapper: {
    position: 'relative',
  },
  validIndicator: {
    position: 'absolute',
    right: 50,
    top: 18,
  },
  customCodeToggle: {
    marginBottom: SPACING.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  toggleDisabled: {
    color: COLORS.textMuted,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginLeft: SPACING.sm,
  },
  proText: {
    color: COLORS.warning,
    fontSize: SIZES.xs,
    fontWeight: '700',
    marginLeft: 4,
  },
});

export default UrlForm;
