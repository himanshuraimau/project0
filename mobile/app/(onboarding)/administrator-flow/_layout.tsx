import React from 'react'
import { Stack } from 'expo-router'

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="administrator1" options={{ headerShown: false }} />
      <Stack.Screen name="administrator2" options={{ headerShown: false }} />
      <Stack.Screen name="administrator3" options={{ headerShown: false }} />
    </Stack>
  )
}
