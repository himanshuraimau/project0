import { Stack } from 'expo-router'

export default function PaywallLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="paywall1" />
      <Stack.Screen name="paywall2" />
      <Stack.Screen name="paywall3" />
      <Stack.Screen name="paywall4" />
    </Stack>
  )
}
