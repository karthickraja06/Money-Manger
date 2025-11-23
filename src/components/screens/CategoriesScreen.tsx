import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { DatabaseService } from '../../services/database';
import { useStore } from '../../store/appStore';
import { Category, TransactionCategory } from '../../types';

export const CategoriesScreen: React.FC = () => {
  const userId = useStore((state) => state.user?.id) || '';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: 'Food' as TransactionCategory,
    color: '#FF6B6B',
    icon: '🍕',
  });

  const predefinedCategories: Array<{ name: TransactionCategory; emoji: string; color: string }> = [
    { name: 'Food', emoji: '🍕', color: '#FF6B6B' },
    { name: 'Entertainment', emoji: '🎬', color: '#FF8C42' },
    { name: 'Travel', emoji: '✈️', color: '#4ECDC4' },
    { name: 'Shopping', emoji: '🛍️', color: '#FF1493' },
    { name: 'Utilities', emoji: '💡', color: '#FFD700' },
    { name: 'Salary', emoji: '💰', color: '#34C759' },
    { name: 'Medical', emoji: '⚕️', color: '#FF0000' },
    { name: 'Education', emoji: '📚', color: '#4169E1' },
    { name: 'Rent', emoji: '🏠', color: '#8B4513' },
    { name: 'Savings', emoji: '🏦', color: '#20B2AA' },
    { name: 'Investment', emoji: '📈', color: '#228B22' },
    { name: 'Bills', emoji: '📄', color: '#696969' },
    { name: 'Loan', emoji: '🔗', color: '#DC143C' },
    { name: 'Insurance', emoji: '🛡️', color: '#4B0082' },
    { name: 'Gifts', emoji: '🎁', color: '#FFB6C1' },
    { name: 'Refund', emoji: '💵', color: '#00CED1' },
    { name: 'Other', emoji: '📌', color: '#A9A9A9' },
  ];

  useEffect(() => {
    loadCategories();
  }, [userId]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      // In a real app, fetch from database
      // For now, use predefined categories
      const defaultCategories: Category[] = predefinedCategories.map((cat, idx) => ({
        id: `cat_${idx}`,
        user_id: userId,
        name: cat.name,
        color: cat.color,
        icon: cat.emoji,
        created_at: new Date().toISOString(),
      }));
      setCategories(defaultCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.name) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    // Check if already added
    if (categories.some(c => c.name === newCategory.name)) {
      Alert.alert('Info', 'This category is already added');
      return;
    }

    const category: Category = {
      id: `cat_${Date.now()}`,
      user_id: userId,
      name: newCategory.name,
      color: newCategory.color,
      icon: newCategory.icon,
      created_at: new Date().toISOString(),
    };

    setCategories([...categories, category]);
    Alert.alert('✅ Category added');
    setModalVisible(false);
    setNewCategory({ name: 'Food' as TransactionCategory, color: '#FF6B6B', icon: '🍕' });
  };

  const handleDeleteCategory = (categoryId: string) => {
    Alert.alert('Delete Category?', 'This action cannot be undone', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setCategories(categories.filter(c => c.id !== categoryId));
          Alert.alert('✅ Category deleted');
        },
      },
    ]);
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onLongPress={() => handleDeleteCategory(item.id)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
        <Text style={styles.categoryEmoji}>{item.icon}</Text>
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryColor}>{item.color}</Text>
      </View>
      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Categories Grid */}
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />

      {/* Add Category Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Category</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionLabel}>Select Category</Text>
              <View style={styles.categorySelector}>
                {predefinedCategories
                  .filter(cat => !categories.some(c => c.name === cat.name))
                  .map((cat) => (
                    <TouchableOpacity
                      key={cat.name}
                      style={[
                        styles.categoryOption,
                        newCategory.name === cat.name && styles.categoryOptionActive,
                      ]}
                      onPress={() => setNewCategory({
                        name: cat.name,
                        color: cat.color,
                        icon: cat.emoji,
                      })}
                    >
                      <Text style={styles.categoryOptionEmoji}>{cat.emoji}</Text>
                      <Text style={styles.categoryOptionName}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
              </View>

              {newCategory.name && (
                <>
                  <Text style={styles.sectionLabel}>Preview</Text>
                  <View style={styles.preview}>
                    <View style={[styles.previewIcon, { backgroundColor: newCategory.color + '20' }]}>
                      <Text style={styles.previewEmoji}>{newCategory.icon}</Text>
                    </View>
                    <View>
                      <Text style={styles.previewName}>{newCategory.name}</Text>
                      <View style={[styles.previewColor, { backgroundColor: newCategory.color }]} />
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleAddCategory}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  categoryColor: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    fontSize: 20,
    color: '#999',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    maxHeight: '70%',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryOption: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  categoryOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FF',
  },
  categoryOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryOptionName: {
    fontSize: 10,
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewEmoji: {
    fontSize: 24,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  previewColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  addBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});
