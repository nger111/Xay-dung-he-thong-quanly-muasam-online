import { Stack } from 'expo-router';

export default function PosLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="scanner" options={{ headerShown: true, title: 'Quét mã vạch', headerStyle: { backgroundColor: '#2563EB' }, headerTintColor: '#ffffff' }} />
    </Stack>
  );
}
