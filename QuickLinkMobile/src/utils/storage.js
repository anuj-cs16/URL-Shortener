/**
 * @file storage.js
 * @description Secure token storage and AsyncStorage utilities.
 *              Tokens stored in encrypted secure storage; user data in AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

// NOTE: react-native-secure-key-store requires native linking.
// We use a try/catch wrapper to gracefully fall back to AsyncStorage in dev if needed.
let SecureStore;
try {
  SecureStore = require('react-native-secure-key-store').default;
} catch (e) {
  SecureStore = null;
}

/**
 * Save JWT token to secure encrypted storage.
 */
export const saveToken = async (token) => {
  try {
    if (SecureStore) {
      await SecureStore.set(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      // Fallback for dev/environments without native secure storage
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
  } catch (error) {
    console.error('Error saving token:', error);
    // Fallback to AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }
};

/**
 * Retrieve JWT token from secure storage.
 */
export const getToken = async () => {
  try {
    if (SecureStore) {
      const token = await SecureStore.get(STORAGE_KEYS.AUTH_TOKEN);
      return token;
    }
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    // Fallback to AsyncStorage
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (fallbackError) {
      return null;
    }
  }
};

/**
 * Save user data object to AsyncStorage.
 */
export const saveUser = async (user) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
};

/**
 * Retrieve user data from AsyncStorage.
 */
export const getUser = async () => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Clear all authentication data from both stores.
 */
export const clearAuth = async () => {
  try {
    if (SecureStore) {
      try {
        await SecureStore.remove(STORAGE_KEYS.AUTH_TOKEN);
      } catch (e) {
        // Ignore if key doesn't exist
      }
    }
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
};

/**
 * Cache data with optional TTL.
 */
export const cacheData = async (key, data, ttlMinutes = 5) => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Error caching data:', error);
  }
};

/**
 * Retrieve cached data, returns null if expired.
 */
export const getCachedData = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp, ttl } = JSON.parse(cached);
    if (Date.now() - timestamp > ttl) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return data;
  } catch (error) {
    return null;
  }
};

/**
 * Clear all cached data.
 */
export const clearCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      (key) =>
        key.startsWith('@quicklink_cached_') ||
        key === STORAGE_KEYS.CACHED_URLS ||
        key === STORAGE_KEYS.CACHED_STATS,
    );
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
