import { Stack } from 'expo-router';

export default function ProductsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#16a34a' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Danh sách sản phẩm' }} />
      <Stack.Screen name="add" options={{ title: 'Thêm sản phẩm mới' }} />
    </Stack>
  );
}
