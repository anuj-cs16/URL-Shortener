/**
 * @file MainNavigator.js
 * @description Bottom tab navigator with 5 tabs: Home, URLs, Create (center floating), Analytics, Profile.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import HomeScreen from '../screens/home/HomeScreen';
import UrlListScreen from '../screens/urls/UrlListScreen';
import CreateUrlScreen from '../screens/urls/CreateUrlScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { COLORS, SIZES, SHADOWS } from '../config/theme';

const Tab = createBottomTabNavigator();

/**
 * Custom center floating "Create" tab button.
 */
const CreateTabButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={styles.createButtonContainer}
    onPress={onPress}
    activeOpacity={0.8}>
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.createButtonGradient}>
      <Icon name="add" size={32} color={COLORS.white} />
    </LinearGradient>
  </TouchableOpacity>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.tabBarActive,
        tabBarInactiveTintColor: COLORS.tabBarInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'URLs':
              iconName = focused ? 'link' : 'link-outline';
              break;
            case 'Create':
              iconName = 'add-circle';
              break;
            case 'Analytics':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Icon name={iconName} size={size || 24} color={color} />;
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="URLs" component={UrlListScreen} />
      <Tab.Screen
        name="Create"
        component={CreateUrlScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => <CreateTabButton {...props} />,
        }}
      />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: Platform.OS === 'ios' ? 88 : 65,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tabLabel: {
    fontSize: SIZES.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  createButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  createButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
});

export default MainNavigator;
