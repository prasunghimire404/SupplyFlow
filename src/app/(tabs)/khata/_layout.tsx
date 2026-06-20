import { Stack } from "expo-router";

export default function KhataLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pending-payments" />
      <Stack.Screen name="pending-collections" />
      <Stack.Screen name="add-client" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
