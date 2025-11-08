import { Stack } from 'expo-router'

export default function ParentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="parent1" />
  <Stack.Screen name="parent2" />
  <Stack.Screen name="parent3" />
  <Stack.Screen name="parent4" />
  <Stack.Screen name="parent5" />
    </Stack>
  )
}
