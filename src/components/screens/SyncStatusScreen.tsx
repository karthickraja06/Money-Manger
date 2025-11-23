import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import type { SyncProgress, SyncResult } from '../../services/smsSyncManager';
import { SMSSyncManager } from '../../services/smsSyncManager';

export interface SyncStatusScreenProps {
  userId: string;
}

export const SyncStatusScreen: React.FC<SyncStatusScreenProps> = ({ userId }) => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    // Load last sync result and accounts
    loadSyncStatus();
  }, [userId]);

  const loadSyncStatus = async () => {
    try {
      const summary = await SMSSyncManager.getAccountsSummary(userId);
      setAccounts(summary);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setProgress(null);

      // Subscribe to progress updates
      const unsubscribe = SMSSyncManager.onProgress((p: SyncProgress) => {
        setProgress(p);
      });

      // Start sync
      const result = await SMSSyncManager.performSync(userId);
      setLastResult(result);

      // Unsubscribe
      unsubscribe();

      // Reload accounts
      await loadSyncStatus();

      if (result.success) {
        Alert.alert(
          '✅ Sync Complete',
          `Processed ${result.smsProcessed} SMS\n${result.transactionsStored} transactions stored`
        );
      } else {
        Alert.alert('❌ Sync Failed', result.errors.join('\n'));
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setSyncing(false);
      setProgress(null);
    }
  };

  const handleClear = async () => {
    Alert.alert(
      'Clear History?',
      'This will allow re-syncing of previously processed SMS',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            await SMSSyncManager.clearSync();
            Alert.alert('✅ History cleared');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const getStageColor = (stage: string): string => {
    switch (stage) {
      case 'complete':
        return '#34C759';
      case 'processing':
        return '#007AFF';
      default:
        return '#999';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Sync Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleSync}
          disabled={syncing}
          style={[
            styles.syncButton,
            syncing && styles.syncButtonDisabled,
          ]}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
          ) : (
            <Text style={styles.syncButtonText}>📱 Start Sync</Text>
          )}
        </TouchableOpacity>

        {!syncing && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>🔄 Clear History</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Display */}
      {progress && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressStage}>{progress.message}</Text>
            <Text style={styles.progressPercent}>
              {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  backgroundColor: getStageColor(progress.stage),
                },
              ]}
            />
          </View>
          <Text style={styles.progressCounter}>
            {progress.current} / {progress.total}
          </Text>
        </View>
      )}

      {/* Last Result */}
      {lastResult && !syncing && (
        <View style={styles.resultCard}>
          <View
            style={[
              styles.resultHeader,
              { backgroundColor: lastResult.success ? '#34C75920' : '#FF3B3020' },
            ]}
          >
            <Text style={styles.resultStatus}>
              {lastResult.success ? '✅ Last Sync Successful' : '❌ Last Sync Failed'}
            </Text>
            <Text style={styles.resultTime}>
              {new Date(lastResult.timestamp).toLocaleTimeString()}
            </Text>
          </View>

          <View style={styles.resultStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>SMS Read</Text>
              <Text style={styles.statValue}>{lastResult.smsRead}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Processed</Text>
              <Text style={styles.statValue}>{lastResult.smsProcessed}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Transactions</Text>
              <Text style={styles.statValue}>{lastResult.transactionsStored}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Failed</Text>
              <Text style={[styles.statValue, { color: '#FF3B30' }]}>
                {lastResult.failed}
              </Text>
            </View>
          </View>

          <View style={styles.resultFooter}>
            <Text style={styles.resultDuration}>
              ⏱️ Duration: {(lastResult.duration / 1000).toFixed(2)}s
            </Text>
          </View>

          {lastResult.errors.length > 0 && (
            <View style={styles.errorsSection}>
              <Text style={styles.errorsTitle}>Errors:</Text>
              {lastResult.errors.slice(0, 3).map((error: string, idx: number) => (
                <Text key={idx} style={styles.errorItem}>
                  • {error}
                </Text>
              ))}
              {lastResult.errors.length > 3 && (
                <Text style={styles.errorItem}>
                  ... and {lastResult.errors.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Accounts Summary */}
      {accounts.length > 0 && (
        <View style={styles.accountsSection}>
          <Text style={styles.sectionTitle}>Synced Accounts</Text>
          {accounts.map((account) => (
            <View key={account.accountId} style={styles.accountItem}>
              <View>
                <Text style={styles.accountName}>{account.bank}</Text>
                <Text style={styles.accountTxns}>
                  {account.transactionCount} transactions
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.accountBalance}>
                  ₹{account.balance.toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 How it works:</Text>
        <Text style={styles.infoText}>
          1. Click "Start Sync" to read SMS from your device{'\n'}
          2. Each SMS is parsed to extract transaction details{'\n'}
          3. Bank is detected and account is found or created{'\n'}
          4. Transaction is stored and balance is updated{'\n'}
          5. View your accounts and transactions above
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressStage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressCounter: {
    fontSize: 12,
    color: '#999',
  },
  resultCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  resultHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  resultStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
    marginTop: 4,
  },
  resultFooter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resultDuration: {
    fontSize: 12,
    color: '#999',
  },
  errorsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF3F320',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  errorsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorItem: {
    fontSize: 11,
    color: '#FF3B30',
    marginBottom: 4,
  },
  accountsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  accountTxns: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
  },
  infoCard: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 40,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
});
