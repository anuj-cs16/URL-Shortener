/**
 * @file StackNavigator.js
 * @description Stack navigator for detail/nested screens accessible from tabs.
 */

import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import UrlDetailScreen from '../screens/urls/UrlDetailScreen';
import UrlAnalyticsScreen from '../screens/analytics/UrlAnalyticsScreen';
import ScannerScreen from '../screens/home/ScannerScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import SecurityScreen from '../screens/profile/SecurityScreen';
import SubscriptionScreen from '../screens/profile/SubscriptionScreen';
import { COLORS, SIZES } from '../config/theme';

const Stack = createStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        ...TransitionPresets.SlideFromRightIOS,
        headerStyle: {
          backgroundColor: COLORS.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontSize: SIZES.lg,
          fontWeight: '600',
        },
        headerBackTitleVisible: false,
        cardStyle: { backgroundColor: COLORS.background },
      }}>
      <Stack.Screen
        name="UrlDetailScreen"
        component={UrlDetailScreen}
        options={{ title: 'URL Details' }}
      />
      <Stack.Screen
        name="UrlAnalyticsScreen"
        component={UrlAnalyticsScreen}
        options={{ title: 'URL Analytics' }}
      />
      <Stack.Screen
        name="ScannerScreen"
        component={ScannerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="SecurityScreen"
        component={SecurityScreen}
        options={{ title: 'Security' }}
      />
      <Stack.Screen
        name="SubscriptionScreen"
        component={SubscriptionScreen}
        options={{ title: 'Subscription' }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
