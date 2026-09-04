/**
 * @file UrlListScreen.js
 * @description URL history list with search, filter tabs, FlatList, pull-to-refresh, and swipe actions.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';
import UrlCard from '../../components/url/UrlCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';
import useUrls from '../../hooks/useUrls';
import { showConfirm } from '../../utils/helpers';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '../../config/theme';
import { URL_FILTERS, SORT_OPTIONS } from '../../config/constants';

const UrlListScreen = ({ navigation }) => {
  const { urls, isLoading, isRefreshing, error, fetchUrls, deleteUrlByCode } = useUrls();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  const onRefresh = useCallback(() => {
    fetchUrls(true);
  }, [fetchUrls]);

  const handleDelete = useCallback(
    (shortCode) => {
      showConfirm('Delete URL', 'Are you sure you want to delete this URL?', () => {
        deleteUrlByCode(shortCode);
      });
    },
    [deleteUrlByCode],
  );

  const handleUrlPress = useCallback(
    (url) => {
      navigation.navigate('UrlDetail', {
        screen: 'UrlDetailScreen',
        params: { url },
      });
    },
    [navigation],
  );

  const handleAnalytics = useCallback(
    (url) => {
      navigation.navigate('UrlDetail', {
        screen: 'UrlAnalyticsScreen',
        params: { shortCode: url.shortCode },
      });
    },
    [navigation],
  );

  // Filter + Search + Sort
  const filteredUrls = useMemo(() => {
    let result = [...urls];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (url) =>
          url.shortCode?.toLowerCase().includes(query) ||
          url.longUrl?.toLowerCase().includes(query),
      );
    }

    // Filter
    switch (activeFilter) {
      case 'Active':
        result = result.filter((url) => url.isActive !== false);
        break;
      case 'Expired':
        result = result.filter((url) => url.isActive === false);
        break;
      case 'Top Clicked':
        result = result.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        break;
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'most_clicks':
        result.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        break;
      case 'least_clicks':
        result.sort((a, b) => (a.clicks || 0) - (b.clicks || 0));
        break;
    }

    return result;
  }, [urls, searchQuery, activeFilter, sortBy]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <Animatable.View animation="fadeInUp" duration={400} delay={index * 50}>
        <UrlCard
          url={item}
          onPress={handleUrlPress}
          onDelete={handleDelete}
          onAnalytics={handleAnalytics}
        />
      </Animatable.View>
    ),
    [handleUrlPress, handleDelete, handleAnalytics],
  );

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by URL or short code..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {URL_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
            onPress={() => setActiveFilter(filter)}>
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results count */}
      <Text style={styles.resultCount}>
        {filteredUrls.length} URL{filteredUrls.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  if (error && !urls.length) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorMessage message={error} onRetry={fetchUrls} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My URLs</Text>
        <Text style={styles.subtitle}>{urls.length} total links</Text>
      </View>

      <FlatList
        data={filteredUrls}
        renderItem={renderItem}
        keyExtractor={(item) => item._id || item.shortCode}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          isLoading ? (
            <LoadingSpinner />
          ) : (
            <EmptyState
              icon="🔗"
              title="No URLs Found"
              message={
                searchQuery
                  ? 'No URLs match your search. Try a different query.'
                  : "You haven't created any short URLs yet."
              }
              actionTitle={searchQuery ? undefined : 'Create Your First URL'}
              onAction={searchQuery ? undefined : () => navigation.navigate('Create')}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: SIZES.xxxl,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.huge,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 48,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: SIZES.md,
    marginLeft: SPACING.sm,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  resultCount: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
});

export default UrlListScreen;
