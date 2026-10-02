import { Stack } from 'expo-router';

export default function PosLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#16a34a' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Bán hàng (POS)' }} />
      <Stack.Screen name="scanner" options={{ title: 'Quét mã vạch', presentation: 'modal' }} />
    </Stack>
  );
}
