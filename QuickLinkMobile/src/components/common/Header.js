/**
 * @file Header.js
 * @description Reusable screen header with safe-area padding, back button, title, subtitle, and right action.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES, SPACING, GRADIENTS } from '../../config/theme';

const Header = ({
  title,
  subtitle,
  leftIcon = 'chevron-back',
  rightIcon,
  onLeftPress,
  onRightPress,
  rightComponent,
  gradient = false,
  transparent = false,
}) => {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;

  const content = (
    <View style={[styles.container, { paddingTop: topPadding + 8 }]}>
      <View style={styles.row}>
        {onLeftPress ? (
          <TouchableOpacity onPress={onLeftPress} style={styles.iconButton} activeOpacity={0.7}>
            <Icon name={leftIcon} size={24} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightComponent ? (
          rightComponent
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.iconButton} activeOpacity={0.7}>
            <Icon name={rightIcon} size={24} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[!transparent && styles.background]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
  },
  iconPlaceholder: {
    width: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  title: {
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default Header;
