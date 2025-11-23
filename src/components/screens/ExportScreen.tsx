/**
 * Export Screen
 * 
 * Export transactions in multiple formats:
 * - CSV (for Excel/spreadsheet)
 * - JSON (for backup/import)
 * - Summary report (PDF-like format)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
  TextInput,
} from 'react-native';
import { useStore } from '../../store/appStore';
import { DatabaseService } from '../../services';

interface ExportData {
  startDate: Date | null;
  endDate: Date | null;
  format: 'csv' | 'json' | 'summary';
}

export const ExportScreen: React.FC = () => {
  const userId = useStore((state) => state.user?.id);
  const [exportConfig, setExportConfig] = useState<ExportData>({
    startDate: null,
    endDate: null,
    format: 'csv',
  });

  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      loadTransactions();
    }
  }, [userId]);

  const loadTransactions = async () => {
    if (!userId) return;
    try {
      const result = await DatabaseService.getTransactions(userId, 10000, 0);
      setTransactions(result.data);
      generateSummary(result.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const generateSummary = (data: any[]) => {
    const totalExpense = data
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = data
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown: Record<string, number> = {};
    data.forEach(t => {
      if (t.type === 'debit') {
        categoryBreakdown[t.category_id] = (categoryBreakdown[t.category_id] || 0) + t.amount;
      }
    });

    setSummary({
      totalTransactions: data.length,
      totalExpense,
      totalIncome,
      net: totalIncome - totalExpense,
      categoryBreakdown,
      dateRange: {
        from: data.length > 0 ? new Date(data[data.length - 1].date) : null,
        to: data.length > 0 ? new Date(data[0].date) : null,
      }
    });
  };

  const generateCSV = (data: any[]) => {
    let csv = 'Date,Merchant,Category,Type,Amount,Account,Reference\n';

    data.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('en-IN');
      const merchant = `"${t.merchant}"`;
      const category = t.category_id || 'Uncategorized';
      const type = t.type === 'debit' ? 'Expense' : 'Income';
      const amount = t.amount;
      const account = t.bank_name || 'Unknown';
      const ref = t.reference || '';

      csv += `${date},${merchant},${category},${type},${amount},${account},"${ref}"\n`;
    });

    return csv;
  };

  const generateJSON = (data: any[]) => {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalRecords: data.length,
      transactions: data.map(t => ({
        date: t.date,
        merchant: t.merchant,
        category: t.category_id,
        type: t.type,
        amount: t.amount,
        account: t.bank_name,
        reference: t.reference,
      }))
    }, null, 2);
  };

  const generateSummaryReport = (data: any[]) => {
    const filtered = filterByDateRange(data);
    const totalExpense = filtered
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = filtered
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown: Record<string, number> = {};
    filtered.forEach(t => {
      if (t.type === 'debit') {
        categoryBreakdown[t.category_id] = (categoryBreakdown[t.category_id] || 0) + t.amount;
      }
    });

    let report = '═══════════════════════════════════════════\n';
    report += '           MONEY MANAGER REPORT\n';
    report += '═══════════════════════════════════════════\n\n';

    report += `Generated: ${new Date().toLocaleString('en-IN')}\n`;
    report += `Period: ${exportConfig.startDate ? new Date(exportConfig.startDate).toLocaleDateString('en-IN') : 'All time'} `;
    report += `to ${exportConfig.endDate ? new Date(exportConfig.endDate).toLocaleDateString('en-IN') : 'Today'}\n\n`;

    report += '───────────────────────────────────────────\n';
    report += '           SUMMARY\n';
    report += '───────────────────────────────────────────\n';
    report += `Total Transactions: ${filtered.length}\n`;
    report += `Total Income: ₹${totalIncome.toLocaleString('en-IN')}\n`;
    report += `Total Expenses: ₹${totalExpense.toLocaleString('en-IN')}\n`;
    report += `Net: ₹${(totalIncome - totalExpense).toLocaleString('en-IN')}\n\n`;

    report += '───────────────────────────────────────────\n';
    report += '        EXPENSE BREAKDOWN\n';
    report += '───────────────────────────────────────────\n';

    Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, amount]) => {
        const percentage = ((amount / totalExpense) * 100).toFixed(1);
        const bar = '█'.repeat(Math.floor((amount / totalExpense) * 40));
        report += `${category.padEnd(15)} ₹${(amount as number).toLocaleString('en-IN').padStart(10)} (${percentage}%) ${bar}\n`;
      });

    report += '\n═══════════════════════════════════════════\n';

    return report;
  };

  const filterByDateRange = (data: any[]) => {
    let filtered = data;

    if (exportConfig.startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= exportConfig.startDate!);
    }

    if (exportConfig.endDate) {
      const endDate = new Date(exportConfig.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.date) <= endDate);
    }

    return filtered;
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      const filtered = filterByDateRange(transactions);

      if (filtered.length === 0) {
        Alert.alert('No Data', 'No transactions found for the selected date range');
        return;
      }

      let content = '';
      let filename = '';

      switch (exportConfig.format) {
        case 'csv':
          content = generateCSV(filtered);
          filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'json':
          content = generateJSON(filtered);
          filename = `transactions_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'summary':
          content = generateSummaryReport(filtered);
          filename = `report_${new Date().toISOString().split('T')[0]}.txt`;
          break;
      }

      // Try to share the content
      try {
        await Share.share({
          message: content,
          title: filename,
        });
      } catch (shareError) {
        // If share fails, show the content in an alert
        Alert.alert(
          'Export Data',
          `${filename}\n\n${content.substring(0, 500)}...`,
          [
            {
              text: 'Copy',
              onPress: () => {
                // Copy to clipboard
                alert('Data ready to copy and save');
              },
            },
            { text: 'Close', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', String(error));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Export Transactions</Text>
        <Text style={styles.headerSubtitle}>
          Download or share your transaction data
        </Text>
      </View>

      {/* Format Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Format</Text>

        <View style={styles.formatGrid}>
          {[
            { id: 'csv', label: 'CSV', description: 'Excel/Spreadsheet' },
            { id: 'json', label: 'JSON', description: 'Backup/Import' },
            { id: 'summary', label: 'Summary', description: 'Report' },
          ].map((format) => (
            <TouchableOpacity
              key={format.id}
              style={[
                styles.formatCard,
                exportConfig.format === format.id && styles.formatCardActive
              ]}
              onPress={() => setExportConfig({ ...exportConfig, format: format.id as any })}
            >
              <Text style={styles.formatLabel}>{format.label}</Text>
              <Text style={styles.formatDescription}>{format.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Range */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Date Range</Text>

        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>From</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Text style={styles.dateInputText}>
                {exportConfig.startDate
                  ? new Date(exportConfig.startDate).toLocaleDateString('en-IN')
                  : 'All time'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>To</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Text style={styles.dateInputText}>
                {exportConfig.endDate
                  ? new Date(exportConfig.endDate).toLocaleDateString('en-IN')
                  : 'Today'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Summary Statistics */}
      {summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Summary</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Transactions</Text>
              <Text style={styles.statValue}>{summary.totalTransactions}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={[styles.statValue, { color: '#388e3c' }]}>
                {formatCurrency(summary.totalIncome)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={[styles.statValue, { color: '#d32f2f' }]}>
                {formatCurrency(summary.totalExpense)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Net</Text>
              <Text style={[
                styles.statValue,
                { color: summary.net >= 0 ? '#388e3c' : '#d32f2f' }
              ]}>
                {formatCurrency(summary.net)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Top Categories */}
      {summary && Object.keys(summary.categoryBreakdown).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Top Categories</Text>

          {Object.entries(summary.categoryBreakdown)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 5)
            .map(([category, amount]) => (
              <View key={category} style={styles.categoryRow}>
                <Text style={styles.categoryName}>{category}</Text>
                <Text style={styles.categoryAmount}>
                  {formatCurrency(amount as number)}
                </Text>
              </View>
            ))}
        </View>
      )}

      {/* Export Button */}
      <TouchableOpacity
        style={styles.exportButton}
        onPress={handleExport}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.exportButtonText}>📤 Export & Share</Text>
        )}
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ About Export Formats</Text>
        <Text style={styles.infoText}>
          <Text style={{ fontWeight: '600' }}>CSV:</Text> Open in Excel, Google Sheets, or any spreadsheet app
        </Text>
        <Text style={styles.infoText}>
          <Text style={{ fontWeight: '600' }}>JSON:</Text> Perfect for backup or importing to other apps
        </Text>
        <Text style={styles.infoText}>
          <Text style={{ fontWeight: '600' }}>Summary:</Text> Beautiful text report with analytics
        </Text>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  formatGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  formatCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatCardActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  formatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  formatDescription: {
    fontSize: 12,
    color: '#999',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateInputText: {
    fontSize: 14,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#0d47a1',
    marginBottom: 6,
    lineHeight: 18,
  },
});
