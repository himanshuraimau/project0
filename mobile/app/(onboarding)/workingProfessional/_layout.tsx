import { Stack } from 'expo-router'

export default function WorkingProfessionalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="workingProfessional1" />
      <Stack.Screen name="workingProfessional2" />
      <Stack.Screen name="workingProfessional3" />
      <Stack.Screen name="workingProfessional4" />
    </Stack>
  )
}
