/**
 * PHASE 5 TODO 6: Search Functionality Screen
 * Real-time search with merchant autocomplete and advanced options
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/src/context/ThemeContext';
import { DatabaseService } from '@/src/services/database';
import { useStore } from '@/src/store/appStore';
import { Transaction } from '@/src/types';

interface SearchScreenProps {
  onClose: () => void;
  onSelectTransaction?: (transaction: Transaction) => void;
}

const { width } = Dimensions.get('window');

export function SearchScreen({ onClose, onSelectTransaction }: SearchScreenProps) {
  const { isDarkMode } = useTheme();
  const userId = useStore((state) => state.user?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load transactions on mount
  useEffect(() => {
    if (!userId) return;

    const loadTransactions = async () => {
      try {
        setLoading(true);
        const data = await DatabaseService.getTransactions(userId, 500, 0);
        setTransactions(data.data || []);
        // Load search history from localStorage simulation
        loadSearchHistory();
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [userId]);

  const loadSearchHistory = () => {
    // In a real app, this would load from AsyncStorage
    setSearchHistory(['pizza', 'amazon', 'uber', 'swiggy', 'flipkart']);
  };

  // Filter transactions based on search term
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const lowerSearch = searchTerm.toLowerCase();
    return transactions.filter(txn => {
      const merchant = (txn.merchant || '').toLowerCase();
      const notes = (txn.notes || '').toLowerCase();
      return merchant.includes(lowerSearch) || notes.includes(lowerSearch);
    });
  }, [searchTerm, transactions]);

  // Get merchant suggestions
  const merchantSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return searchHistory.slice(0, 5);

    const lowerSearch = searchTerm.toLowerCase();
    const merchants = new Set(
      transactions
        .map(txn => txn.merchant?.toLowerCase())
        .filter(m => m && m.includes(lowerSearch))
    );

    return Array.from(merchants).slice(0, 8);
  }, [searchTerm, transactions, searchHistory]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() && !searchHistory.includes(term)) {
      setSearchHistory([term, ...searchHistory].slice(0, 10));
    }
  };

  const handleSelectMerchant = (merchant: string) => {
    setSearchTerm(merchant);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    if (onSelectTransaction) {
      onSelectTransaction(transaction);
    }
  };

  const renderSuggestion = (merchant: string) => (
    <TouchableOpacity
      key={merchant}
      style={[styles.suggestionChip, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0' }]}
      onPress={() => handleSelectMerchant(merchant)}
    >
      <ThemedText style={styles.suggestionText}>🔍 {merchant}</ThemedText>
    </TouchableOpacity>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={[
        styles.transactionItem,
        { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }
      ]}
      onPress={() => handleTransactionPress(item)}
    >
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.transactionIcon,
            { backgroundColor: item.is_income ? '#34C75920' : '#FF3B3020' }
          ]}
        >
          <ThemedText style={styles.transactionIconText}>
            {item.is_income ? '📥' : '📤'}
          </ThemedText>
        </View>
        <View>
          <ThemedText style={styles.transactionMerchant}>
            {item.merchant || 'Transaction'}
          </ThemedText>
          <ThemedText style={[styles.transactionDate, { color: isDarkMode ? '#aaa' : '#999' }]}>
            {new Date(item.date).toLocaleDateString('en-IN')}
          </ThemedText>
          {item.notes && (
            <ThemedText style={[styles.transactionNotes, { color: isDarkMode ? '#888' : '#bbb' }]}>
              {item.notes.substring(0, 40)}...
            </ThemedText>
          )}
        </View>
      </View>
      <ThemedText
        style={[
          styles.transactionAmount,
          { color: item.is_income ? '#34C759' : '#FF3B30' }
        ]}
      >
        {item.is_income ? '+' : '-'}₹{Math.abs(item.net_amount || item.amount).toLocaleString('en-IN')}
      </ThemedText>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff', borderBottomColor: isDarkMode ? '#444' : '#e0e0e0' }]}>
        <TouchableOpacity onPress={onClose}>
          <ThemedText style={{ fontSize: 16, color: '#007AFF' }}>✕ Close</ThemedText>
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>Search</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Input */}
        <View style={styles.searchInputContainer}>
          <View
            style={[
              styles.searchInputWrapper,
              { backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5', borderColor: isDarkMode ? '#444' : '#ddd' }
            ]}
          >
            <ThemedText style={styles.searchIcon}>🔍</ThemedText>
            <TextInput
              style={[styles.searchInput, { color: isDarkMode ? '#fff' : '#000' }]}
              placeholder="Search transactions..."
              placeholderTextColor={isDarkMode ? '#888' : '#ccc'}
              value={searchTerm}
              onChangeText={handleSearch}
              autoFocus
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <ThemedText style={styles.clearButton}>✕</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Suggestions or Results */}
        {searchTerm.trim().length === 0 ? (
          <>
            {/* Recent Searches */}
            {searchHistory.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>🕐 Recent Searches</ThemedText>
                <View style={styles.suggestionsContainer}>
                  {searchHistory.map(renderSuggestion)}
                </View>
              </View>
            )}

            {/* Quick Tips */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>💡 Quick Tips</ThemedText>
              <View style={[styles.tipBox, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5' }]}>
                <ThemedText style={[styles.tipText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                  • Type a merchant name to find all transactions
                </ThemedText>
                <ThemedText style={[styles.tipText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                  • Search is case-insensitive
                </ThemedText>
                <ThemedText style={[styles.tipText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                  • Searches work across merchant names and notes
                </ThemedText>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Merchant Autocomplete Suggestions */}
            {merchantSuggestions.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>💳 Merchant Suggestions</ThemedText>
                <View style={styles.suggestionsContainer}>
                  {merchantSuggestions.map(merchant => (
                    <TouchableOpacity
                      key={merchant}
                      style={[
                        styles.suggestionChip,
                        { backgroundColor: isDarkMode ? '#0071FF20' : '#007AFF20', borderColor: '#007AFF' }
                      ]}
                      onPress={() => handleSelectMerchant(merchant)}
                    >
                      <ThemedText style={[styles.suggestionText, { color: '#007AFF' }]}>
                        {merchant}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Search Results */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                📋 Results ({filteredResults.length})
              </ThemedText>
              {filteredResults.length === 0 ? (
                <View style={styles.emptyState}>
                  <ThemedText style={styles.emptyStateText}>
                    No transactions found for "{searchTerm}"
                  </ThemedText>
                </View>
              ) : (
                <FlatList
                  data={filteredResults}
                  renderItem={renderTransaction}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => (
                    <View
                      style={[
                        styles.separator,
                        { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }
                      ]}
                    />
                  )}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchInputContainer: {
    marginBottom: 24,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    fontSize: 18,
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tipBox: {
    padding: 12,
    borderRadius: 8,
  },
  tipText: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 18,
  },
  transactionMerchant: {
    fontSize: 13,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 11,
    marginTop: 2,
  },
  transactionNotes: {
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
  },
  separator: {
    height: 1,
    marginVertical: 8,
  },
});
