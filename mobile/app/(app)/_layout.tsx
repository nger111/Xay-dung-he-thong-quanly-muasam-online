import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="pos"
        options={{
          title: 'Bán hàng',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barcode-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="imports"
        options={{
          title: 'Nhập hàng',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="catalog" options={{ href: null, title: 'Cửa hàng' }} />
      <Tabs.Screen name="cart" options={{ href: null, title: 'Giỏ hàng' }} />
      <Tabs.Screen name="checkout" options={{ href: null, title: 'Xác nhận đơn' }} />
      <Tabs.Screen name="product/[id]" options={{ href: null, title: 'Chi tiết sản phẩm' }} />
      <Tabs.Screen name="order/[id]" options={{ href: null, title: 'Chi tiết đơn hàng' }} />
      <Tabs.Screen name="category" options={{ href: null }} />
      <Tabs.Screen name="scan" options={{ href: null }} />
      <Tabs.Screen name="products" options={{ href: null }} />
      <Tabs.Screen name="inventory" options={{ href: null }} />
      <Tabs.Screen name="statistics" options={{ href: null }} />
    </Tabs>
  );
}
