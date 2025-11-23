import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, RefreshControl, Alert } from 'react-native';
import { DatabaseService } from '../../services/database';
import { Transaction } from '../../types';

export interface TransactionsScreenProps {
  userId: string;
  limit?: number;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ userId, limit = 50 }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [userId]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const result = await DatabaseService.getTransactions(userId, limit, 0);
      setTransactions(result.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const getTransactionColor = (type: string): string => {
    switch (type) {
      case 'credit':
      case 'upi':
        return '#34C759';
      case 'debit':
        return '#FF3B30';
      case 'atm':
        return '#FF9500';
      default:
        return '#007AFF';
    }
  };

  const getTransactionIcon = (type: string): string => {
    switch (type) {
      case 'credit':
        return '⬇️';
      case 'debit':
        return '⬆️';
      case 'atm':
        return '🏧';
      case 'upi':
        return '📱';
      default:
        return '💳';
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: `${getTransactionColor(item.type)}20`,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 20 }}>{getTransactionIcon(item.type)}</Text>
      </View>

      {/* Details */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>
          {item.merchant || 'Unknown'}
        </Text>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
          {new Date(item.date).toLocaleDateString()} • {item.type.toUpperCase()}
        </Text>
      </View>

      {/* Amount */}
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: getTransactionColor(item.type),
          }}
        >
          {item.type === 'credit' ? '+' : '-'}₹{item.amount.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
          Recent Transactions
        </Text>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
          {transactions.length} transactions
        </Text>
      </View>

      {/* Transactions List */}
      {transactions.length > 0 ? (
        <FlatList
          scrollEnabled={false}
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Text style={{ fontSize: 16, color: '#999' }}>
            No transactions yet
          </Text>
          <Text style={{ fontSize: 14, color: '#ccc', marginTop: 8 }}>
            Start syncing SMS to see transactions
          </Text>
        </View>
      )}
    </ScrollView>
  );
};
