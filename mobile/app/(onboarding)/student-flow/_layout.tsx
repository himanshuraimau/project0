import React from 'react'
import { Stack } from 'expo-router'

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="student1" options={{ headerShown: false }} />
      <Stack.Screen name="student2" options={{ headerShown: false }} />
      <Stack.Screen name="student3" options={{ headerShown: false }} />
      <Stack.Screen name="student4" options={{ headerShown: false }} />
      <Stack.Screen name="student5" options={{ headerShown: false }} />
      <Stack.Screen name="student6" options={{ headerShown: false }} />
      <Stack.Screen name="student7" options={{ headerShown: false }} />
      <Stack.Screen name="student8" options={{ headerShown: false }} />
      <Stack.Screen name="student9" options={{ headerShown: false }} />
    </Stack>
  )
}
