/**
 * PHASE 5 TODO 7: Filter Presets Management
 * Save and reuse filter combinations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/src/context/ThemeContext';
import { useFilter } from '@/src/context/FilterContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  dateRangeType: string;
  transactionTypes: string[];
  selectedAccounts: string[];
  selectedCategories: string[];
  createdAt: string;
  usageCount: number;
}

interface FilterPresetsScreenProps {
  onClose: () => void;
  onApplyPreset?: (preset: FilterPreset) => void;
}

const { width } = Dimensions.get('window');
const PRESETS_STORAGE_KEY = 'filter_presets';

// Default presets
const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: 'preset-monthly-expenses',
    name: 'Monthly Expenses',
    description: 'All debits for current month',
    dateRangeType: 'month',
    transactionTypes: ['debit'],
    selectedAccounts: [],
    selectedCategories: [],
    createdAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: 'preset-weekly-income',
    name: 'Weekly Income',
    description: 'All credits for current week',
    dateRangeType: 'week',
    transactionTypes: ['credit'],
    selectedAccounts: [],
    selectedCategories: [],
    createdAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: 'preset-today-all',
    name: "Today's Transactions",
    description: 'All transactions from today',
    dateRangeType: 'today',
    transactionTypes: [],
    selectedAccounts: [],
    selectedCategories: [],
    createdAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: 'preset-food-spending',
    name: 'Food Spending',
    description: 'Food category expenses',
    dateRangeType: 'month',
    transactionTypes: ['debit'],
    selectedAccounts: [],
    selectedCategories: ['Food'],
    createdAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: 'preset-travel-expenses',
    name: 'Travel Expenses',
    description: 'Travel category expenses',
    dateRangeType: 'month',
    transactionTypes: ['debit'],
    selectedAccounts: [],
    selectedCategories: ['Travel'],
    createdAt: new Date().toISOString(),
    usageCount: 0,
  },
];

export function FilterPresetsScreen({
  onClose,
  onApplyPreset
}: FilterPresetsScreenProps) {
  const { isDarkMode } = useTheme();
  const { filters } = useFilter();

  const [presets, setPresets] = useState<FilterPreset[]>(DEFAULT_PRESETS);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [loading, setLoading] = useState(true);

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const saved = await AsyncStorage.getItem(PRESETS_STORAGE_KEY);
      if (saved) {
        const customPresets = JSON.parse(saved);
        setPresets([...DEFAULT_PRESETS, ...customPresets]);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentFilters = async () => {
    if (!presetName.trim()) {
      Alert.alert('⚠️ Error', 'Please enter a preset name');
      return;
    }

    try {
      const newPreset: FilterPreset = {
        id: `preset-${Date.now()}`,
        name: presetName,
        description: presetDescription,
        dateRangeType: filters.dateRangeType,
        transactionTypes: filters.transactionTypes,
        selectedAccounts: filters.selectedAccounts,
        selectedCategories: filters.selectedCategories,
        createdAt: new Date().toISOString(),
        usageCount: 0,
      };

      const customPresets = presets.filter(p => !p.id.startsWith('preset-'));
      const updated = [...DEFAULT_PRESETS, ...customPresets, newPreset];
      setPresets(updated);

      // Save custom presets only
      const customToSave = updated.filter(p => !p.id.startsWith('preset-'));
      await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(customToSave));

      Alert.alert('✅ Success', `Preset "${presetName}" saved successfully`);
      setPresetName('');
      setPresetDescription('');
      setSaveModalVisible(false);
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to save preset');
    }
  };

  const deletePreset = (presetId: string) => {
    if (presetId.startsWith('preset-')) {
      Alert.alert('⚠️ Cannot Delete', 'Default presets cannot be deleted');
      return;
    }

    Alert.alert('Delete Preset?', 'Are you sure you want to delete this preset?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const updated = presets.filter(p => p.id !== presetId);
            setPresets(updated);

            const customToSave = updated.filter(p => !p.id.startsWith('preset-'));
            await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(customToSave));
          } catch (error) {
            Alert.alert('❌ Error', 'Failed to delete preset');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const applyPreset = (preset: FilterPreset) => {
    if (onApplyPreset) {
      onApplyPreset(preset);
    }

    // Update usage count
    const updated = presets.map(p =>
      p.id === preset.id ? { ...p, usageCount: p.usageCount + 1 } : p
    );
    setPresets(updated);
  };

  const renderPreset = ({ item }: { item: FilterPreset }) => (
    <TouchableOpacity
      style={[
        styles.presetCard,
        { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }
      ]}
      onPress={() => applyPreset(item)}
    >
      <View style={styles.presetHeader}>
        <View style={styles.presetInfo}>
          <ThemedText style={styles.presetName}>{item.name}</ThemedText>
          <ThemedText style={[styles.presetDescription, { color: isDarkMode ? '#aaa' : '#999' }]}>
            {item.description}
          </ThemedText>
        </View>
        {item.usageCount > 0 && (
          <View style={[styles.usageBadge, { backgroundColor: '#007AFF20' }]}>
            <ThemedText style={[styles.usageText, { color: '#007AFF' }]}>
              Used {item.usageCount}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.presetTags}>
        {item.dateRangeType && (
          <View style={[styles.tag, { backgroundColor: isDarkMode ? '#3a3a3a' : '#f5f5f5' }]}>
            <ThemedText style={[styles.tagText, { color: isDarkMode ? '#aaa' : '#666' }]}>
              📅 {item.dateRangeType}
            </ThemedText>
          </View>
        )}
        {item.transactionTypes.length > 0 && (
          <View style={[styles.tag, { backgroundColor: isDarkMode ? '#3a3a3a' : '#f5f5f5' }]}>
            <ThemedText style={[styles.tagText, { color: isDarkMode ? '#aaa' : '#666' }]}>
              💳 {item.transactionTypes.join(', ')}
            </ThemedText>
          </View>
        )}
        {item.selectedCategories.length > 0 && (
          <View style={[styles.tag, { backgroundColor: isDarkMode ? '#3a3a3a' : '#f5f5f5' }]}>
            <ThemedText style={[styles.tagText, { color: isDarkMode ? '#aaa' : '#666' }]}>
              📂 {item.selectedCategories.join(', ')}
            </ThemedText>
          </View>
        )}
      </View>

      {!item.id.startsWith('preset-') && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deletePreset(item.id)}
        >
          <ThemedText style={styles.deleteButtonText}>🗑️ Delete</ThemedText>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff', borderBottomColor: isDarkMode ? '#444' : '#e0e0e0' }]}>
        <TouchableOpacity onPress={onClose}>
          <ThemedText style={{ fontSize: 16, color: '#007AFF' }}>✕ Close</ThemedText>
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>Filter Presets</ThemedText>
        <TouchableOpacity onPress={() => setSaveModalVisible(true)}>
          <ThemedText style={{ fontSize: 16, color: '#007AFF' }}>+ Save</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Presets List */}
      <FlatList
        data={presets}
        renderItem={renderPreset}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />

      {/* Save Modal */}
      <Modal visible={saveModalVisible} transparent={true} animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }
            ]}
          >
            <ThemedText style={styles.modalTitle}>Save Current Filters</ThemedText>

            <TextInput
              style={[
                styles.input,
                { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5', color: isDarkMode ? '#fff' : '#000' }
              ]}
              placeholder="Preset name (e.g., Coffee Shops)"
              placeholderTextColor={isDarkMode ? '#888' : '#ccc'}
              value={presetName}
              onChangeText={setPresetName}
            />

            <TextInput
              style={[
                styles.input,
                { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5', color: isDarkMode ? '#fff' : '#000' }
              ]}
              placeholder="Description (optional)"
              placeholderTextColor={isDarkMode ? '#888' : '#ccc'}
              value={presetDescription}
              onChangeText={setPresetDescription}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: isDarkMode ? '#3a3a3a' : '#f5f5f5' }]}
                onPress={() => {
                  setSaveModalVisible(false);
                  setPresetName('');
                  setPresetDescription('');
                }}
              >
                <ThemedText style={[styles.buttonText, { color: isDarkMode ? '#fff' : '#000' }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#007AFF' }]}
                onPress={saveCurrentFilters}
              >
                <ThemedText style={[styles.buttonText, { color: '#fff' }]}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  presetCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 12,
  },
  usageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  usageText: {
    fontSize: 11,
    fontWeight: '600',
  },
  presetTags: {
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  deleteButton: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FF3B3020',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
