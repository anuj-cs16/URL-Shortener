/**
 * @file ScannerScreen.js
 * @description QR scanner placeholder — URL paste screen since camera packages aren't installed.
 *              Allows users to paste URLs from clipboard to shorten them.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';
import { isValidUrl } from '../../utils/validators';
import { copyToClipboard, shareUrl, openUrl, showSuccess } from '../../utils/helpers';
import useUrls from '../../hooks/useUrls';

const ScannerScreen = ({ navigation }) => {
  const [detectedUrl, setDetectedUrl] = useState('');
  const [urlValid, setUrlValid] = useState(false);
  const [shortened, setShortened] = useState(null);
  const { createUrl, isLoading } = useUrls();

  // Auto-detect URL from clipboard on mount
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await Clipboard.getString();
        if (text && isValidUrl(text)) {
          setDetectedUrl(text);
          setUrlValid(true);
        }
      } catch (e) {
        // Ignore
      }
    };
    checkClipboard();
  }, []);

  const handleUrlChange = (text) => {
    setDetectedUrl(text);
    setUrlValid(isValidUrl(text));
    setShortened(null);
  };

  const handleShorten = async () => {
    if (!urlValid) return;
    const result = await createUrl(detectedUrl);
    if (result.success) {
      setShortened(result.data);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Scan & Shorten"
        onLeftPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        {/* Camera placeholder */}
        <Animatable.View animation="fadeIn" duration={600} style={styles.scannerPlaceholder}>
          <View style={styles.scanFrame}>
            <Icon name="qr-code-outline" size={80} color={COLORS.primary} />
            <Text style={styles.scanTitle}>QR Scanner</Text>
            <Text style={styles.scanSubtitle}>
              Camera-based QR scanning requires native camera setup.
              {'\n'}Paste a URL below to shorten it instead.
            </Text>
          </View>
        </Animatable.View>

        {/* URL Input */}
        <Animatable.View animation="fadeInUp" duration={600} delay={200}>
          <Input
            label="URL to Shorten"
            placeholder="https://example.com/long-url"
            value={detectedUrl}
            onChangeText={handleUrlChange}
            icon="link-outline"
            keyboardType="url"
            autoCapitalize="none"
            rightIcon="clipboard-outline"
            onRightIconPress={async () => {
              const text = await Clipboard.getString();
              if (text) {
                setDetectedUrl(text);
                setUrlValid(isValidUrl(text));
              }
            }}
          />

          {!shortened ? (
            <View style={styles.actions}>
              <Button
                title="Shorten URL"
                onPress={handleShorten}
                variant="primary"
                size="lg"
                icon="flash-outline"
                loading={isLoading}
                disabled={!urlValid}
              />
              {urlValid && (
                <View style={styles.secondaryRow}>
                  <Button
                    title="Open"
                    onPress={() => openUrl(detectedUrl)}
                    variant="ghost"
                    size="sm"
                    icon="open-outline"
                  />
                  <Button
                    title="Copy"
                    onPress={() => copyToClipboard(detectedUrl)}
                    variant="ghost"
                    size="sm"
                    icon="copy-outline"
                  />
                  <Button
                    title="Share"
                    onPress={() => shareUrl(detectedUrl)}
                    variant="ghost"
                    size="sm"
                    icon="share-outline"
                  />
                </View>
              )}
            </View>
          ) : (
            <Card style={styles.resultCard}>
              <Text style={styles.resultLabel}>Shortened URL</Text>
              <Text style={styles.resultUrl} selectable>
                {shortened.shortUrl || shortened.shortCode}
              </Text>
              <View style={styles.resultActions}>
                <Button
                  title="Copy"
                  onPress={() =>
                    copyToClipboard(
                      shortened.shortUrl || shortened.shortCode,
                      'Copied! 🔗',
                    )
                  }
                  variant="primary"
                  size="sm"
                  icon="copy-outline"
                  style={styles.resultBtn}
                />
                <Button
                  title="Share"
                  onPress={() => shareUrl(shortened.shortUrl || shortened.shortCode)}
                  variant="secondary"
                  size="sm"
                  icon="share-outline"
                  style={styles.resultBtn}
                />
              </View>
            </Card>
          )}
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
    padding: SPACING.xl,
  },
  scannerPlaceholder: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  scanTitle: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  scanSubtitle: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    lineHeight: 16,
  },
  actions: {
    marginTop: SPACING.md,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  resultCard: {
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  resultUrl: {
    fontSize: SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  resultActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  resultBtn: {
    flex: 1,
  },
});

export default ScannerScreen;
