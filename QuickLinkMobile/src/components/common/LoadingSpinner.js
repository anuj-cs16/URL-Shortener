/**
 * @file LoadingSpinner.js
 * @description Loading spinner with optional fullscreen overlay and branding.
 */

import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { COLORS, SIZES } from '../../config/theme';

const LoadingSpinner = ({ size = 40, color = COLORS.primary, fullScreen = false, message }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );

    rotate.start();
    if (fullScreen) pulse.start();

    return () => {
      rotate.stop();
      pulse.stop();
    };
  }, [rotateAnim, pulseAnim, fullScreen]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.logoText}>⚡</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.spinner,
            {
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
              borderColor: color,
              transform: [{ rotate: spin }],
            },
          ]}
        />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            transform: [{ rotate: spin }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
    zIndex: 999,
  },
  spinner: {
    borderWidth: 3,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  logoContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  logoText: {
    fontSize: 28,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: SIZES.md,
    marginTop: 16,
  },
});

export default LoadingSpinner;
