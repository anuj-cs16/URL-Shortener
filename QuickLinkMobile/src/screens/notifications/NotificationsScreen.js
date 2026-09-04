/**
 * @file NotificationsScreen.js
 * @description Notifications list grouped by date with mark-all-read, swipe-to-delete, and empty state.
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import NotificationItem from '../../components/notification/NotificationItem';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import useNotifications from '../../hooks/useNotifications';
import { COLORS, SIZES, SPACING } from '../../config/theme';
import moment from 'moment';

const NotificationsScreen = ({ navigation }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAllRead,
    markOneRead,
    removeNotification,
  } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handlePress = useCallback(
    (notification) => {
      if (!notification.isRead) {
        markOneRead(notification._id);
      }
    },
    [markOneRead],
  );

  // Group by date
  const groupedData = useMemo(() => {
    const groups = {};
    notifications.forEach((n) => {
      const date = moment(n.createdAt);
      let label;
      if (date.isSame(moment(), 'day')) {
        label = 'Today';
      } else if (date.isSame(moment().subtract(1, 'day'), 'day')) {
        label = 'Yesterday';
      } else if (date.isSame(moment(), 'week')) {
        label = 'This Week';
      } else {
        label = date.format('MMM D, YYYY');
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(n);
    });

    // Flatten into section-compatible format
    const result = [];
    Object.entries(groups).forEach(([label, items]) => {
      result.push({ type: 'header', label, key: `header-${label}` });
      items.forEach((item) => {
        result.push({ type: 'notification', data: item, key: item._id });
      });
    });
    return result;
  }, [notifications]);

  const renderItem = useCallback(
    ({ item, index }) => {
      if (item.type === 'header') {
        return (
          <Text style={styles.sectionHeader}>{item.label}</Text>
        );
      }

      return (
        <Animatable.View animation="fadeInUp" duration={300} delay={index * 30}>
          <NotificationItem
            notification={item.data}
            onPress={handlePress}
            onDelete={removeNotification}
          />
        </Animatable.View>
      );
    },
    [handlePress, removeNotification],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Badge value={unreadCount} variant="error" size="md" style={styles.badge} />
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllRead}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={groupedData}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? (
            <LoadingSpinner />
          ) : (
            <EmptyState
              icon="🔔"
              title="You're All Caught Up!"
              message="No notifications right now. We'll let you know when something happens."
            />
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
  },
  badge: {
    marginLeft: SPACING.sm,
  },
  markAllRead: {
    fontSize: SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.huge,
  },
  sectionHeader: {
    fontSize: SIZES.sm,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
});

export default NotificationsScreen;
