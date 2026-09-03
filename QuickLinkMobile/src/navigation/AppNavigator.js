/**
 * @file AppNavigator.js
 * @description Root navigator — splash/auth/main switching based on auth state.
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import useAuth from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import StackNavigator from './StackNavigator';
import { setNavigationRef } from '../api/client';
import { COLORS } from '../config/theme';

const RootStack = createStackNavigator();

const SplashScreen = () => (
  <View style={styles.splash}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

const AppNavigator = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const navigationRef = React.useRef(null);

  React.useEffect(() => {
    setNavigationRef(navigationRef);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        dark: true,
        colors: {
          primary: COLORS.primary,
          background: COLORS.background,
          card: COLORS.surface,
          text: COLORS.text,
          border: COLORS.border,
          notification: COLORS.error,
        },
      }}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <RootStack.Screen name="Main" component={MainNavigator} />
            <RootStack.Screen
              name="UrlDetail"
              component={StackNavigator}
              options={{ presentation: 'card' }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default AppNavigator;
