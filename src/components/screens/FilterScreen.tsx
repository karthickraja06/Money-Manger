/**
 * PHASE 5: Filter Screen Component
 * Comprehensive filtering UI with all filter options
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Switch,
  SafeAreaView,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/src/context/ThemeContext';
import { useFilter } from '@/src/context/FilterContext';
import { DatabaseService } from '@/src/services/database';
import { useStore } from '@/src/store/appStore';
import { CATEGORIES, CATEGORY_ICONS } from '@/src/constants';

const { width } = Dimensions.get('window');

interface FilterScreenProps {
  onClose: () => void;
  onApply: () => void;
}

export function FilterScreen({ onClose, onApply }: FilterScreenProps) {
  const { isDarkMode } = useTheme();
  const { filters, updateDateRange, setTransactionTypes, setAccounts, setCategories, setMerchantSearch, resetFilters, hasActiveFilters } = useFilter();
  const userId = useStore((state) => state.user?.id);
  const [accounts, setAccounts_] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (userId) {
      DatabaseService.getAccounts(userId).then(setAccounts_);
    }
    setLoading(false);
  }, [userId]);

  const getDateRangeButtonStyle = (type: string) => [
    styles.filterButton,
    filters.dateRangeType === type && styles.filterButtonActive,
    {
      backgroundColor: filters.dateRangeType === type ? '#007AFF' : (isDarkMode ? '#2a2a2a' : '#fff'),
      borderColor: filters.dateRangeType === type ? '#007AFF' : (isDarkMode ? '#444' : '#e0e0e0'),
    },
  ];

  const renderTypeToggle = (type: 'debit' | 'credit' | 'upi' | 'atm' | 'cash', label: string, emoji: string) => {
    const isSelected = filters.transactionTypes.includes(type);
    return (
      <TouchableOpacity
        key={type}
        style={[
          styles.toggleChip,
          isSelected && styles.toggleChipActive,
          {
            backgroundColor: isSelected ? '#007AFF' : (isDarkMode ? '#2a2a2a' : '#f0f0f0'),
            borderColor: isSelected ? '#007AFF' : (isDarkMode ? '#444' : '#e0e0e0'),
          },
        ]}
        onPress={() => {
          const newTypes = filters.transactionTypes.includes(type)
            ? filters.transactionTypes.filter(t => t !== type)
            : [...filters.transactionTypes, type];
          setTransactionTypes(newTypes);
        }}
      >
        <ThemedText style={[styles.toggleChipText, isSelected && styles.toggleChipTextActive]}>
          {emoji} {label}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const renderAccountItem = (account: any) => {
    const isSelected = filters.selectedAccounts.includes(account.id);
    return (
      <TouchableOpacity
        key={account.id}
        style={[
          styles.accountItem,
          isSelected && styles.accountItemSelected,
          {
            backgroundColor: isSelected ? '#007AFF' : (isDarkMode ? '#2a2a2a' : '#fff'),
            borderColor: isSelected ? '#007AFF' : (isDarkMode ? '#444' : '#e0e0e0'),
          },
        ]}
        onPress={() => {
          const newAccounts = filters.selectedAccounts.includes(account.id)
            ? filters.selectedAccounts.filter(id => id !== account.id)
            : [...filters.selectedAccounts, account.id];
          setAccounts(newAccounts);
        }}
      >
        <View>
          <ThemedText style={[styles.accountName, isSelected && { color: '#fff' }]}>
            {account.bank_name}
          </ThemedText>
          <ThemedText style={[styles.accountNumber, isSelected && { color: 'rgba(255,255,255,0.7)' }]}>
            •••• {account.account_number.slice(-4)}
          </ThemedText>
        </View>
        <ThemedText style={[styles.accountBalance, isSelected && { color: '#fff' }]}>
          ₹{account.balance.toLocaleString('en-IN')}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const renderCategoryItem = (category: string) => {
    const isSelected = filters.selectedCategories.includes(category);
    
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryChip,
          isSelected && styles.categoryChipSelected,
          {
            backgroundColor: isSelected ? '#007AFF' : (isDarkMode ? '#2a2a2a' : '#f0f0f0'),
          },
        ]}
        onPress={() => {
          const newCategories = filters.selectedCategories.includes(category)
            ? filters.selectedCategories.filter(c => c !== category)
            : [...filters.selectedCategories, category];
          setCategories(newCategories);
        }}
      >
        <ThemedText style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
          {category}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff', borderBottomColor: isDarkMode ? '#444' : '#e0e0e0' }]}>
        <TouchableOpacity onPress={onClose}>
          <ThemedText style={{ fontSize: 16, color: '#007AFF' }}>✕ Close</ThemedText>
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>Filters</ThemedText>
        <TouchableOpacity onPress={() => { resetFilters(); }}>
          <ThemedText style={{ fontSize: 14, color: '#999' }}>Reset</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Range */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>📅 Date Range</ThemedText>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={getDateRangeButtonStyle('today')} onPress={() => updateDateRange('today')}>
              <ThemedText style={[styles.filterButtonText, filters.dateRangeType === 'today' && styles.filterButtonTextActive]}>
                Today
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={getDateRangeButtonStyle('week')} onPress={() => updateDateRange('week')}>
              <ThemedText style={[styles.filterButtonText, filters.dateRangeType === 'week' && styles.filterButtonTextActive]}>
                This Week
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={getDateRangeButtonStyle('month')} onPress={() => updateDateRange('month')}>
              <ThemedText style={[styles.filterButtonText, filters.dateRangeType === 'month' && styles.filterButtonTextActive]}>
                This Month
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction Type */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>💳 Transaction Type</ThemedText>
          <View style={styles.chipRow}>
            {renderTypeToggle('debit', 'Debit', '📤')}
            {renderTypeToggle('credit', 'Credit', '📥')}
            {renderTypeToggle('upi', 'UPI', '📱')}
          </View>
          <View style={styles.chipRow}>
            {renderTypeToggle('atm', 'ATM', '🏦')}
            {renderTypeToggle('cash', 'Cash', '💵')}
          </View>
        </View>

        {/* Accounts */}
        {!loading && accounts.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>🏦 Accounts</ThemedText>
            <FlatList
              data={accounts}
              renderItem={({ item }) => renderAccountItem(item)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>📂 Categories</ThemedText>
          <View style={styles.chipRow}>
            {Object.keys(CATEGORIES).map(category => renderCategoryItem(category))}
          </View>
        </View>

        {/* Merchant Search */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>🏪 Merchant Search</ThemedText>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? '#444' : '#e0e0e0',
              },
            ]}
            placeholder="Search merchant..."
            placeholderTextColor={isDarkMode ? '#999' : '#ccc'}
            value={filters.merchantSearch}
            onChangeText={setMerchantSearch}
          />
        </View>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.applyButton, hasActiveFilters() && styles.applyButtonActive]}
            onPress={onApply}
          >
            <ThemedText style={styles.applyButtonText}>
              Apply Filters {hasActiveFilters() && '✓'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  toggleChipActive: {
    backgroundColor: '#007AFF',
  },
  toggleChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  toggleChipTextActive: {
    color: '#fff',
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  accountItemSelected: {
    backgroundColor: '#007AFF',
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountNumber: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  footer: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  applyButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ccc',
    alignItems: 'center',
  },
  applyButtonActive: {
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
