import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { categoriesAPI } from '../../../services/api';
import { CategoryCard, Category } from '../../../components/shared/CategoryCard';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Colors } from '../../../constants/colors';

export default function CategoryScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      const data = res.data?.data ?? res.data ?? [];
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
  }, []);

  if (loading) return <Spinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh mục</Text>
        <Text style={styles.subtitle}>{categories.length} danh mục sản phẩm</Text>
      </View>

      {categories.length === 0 ? (
        <EmptyState
          icon="grid-outline"
          title="Chưa có danh mục"
          subtitle="Các danh mục sản phẩm sẽ xuất hiện ở đây"
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          renderItem={({ item, index }) => (
            <CategoryCard category={item} index={index} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
  },
});
