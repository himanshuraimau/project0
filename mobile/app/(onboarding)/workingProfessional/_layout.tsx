import { Stack } from 'expo-router'

export default function WorkingProfessionalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="workingProfessional1" />
      <Stack.Screen name="workingProfessional2" />
      <Stack.Screen name="workingProfessional3" />
      <Stack.Screen name="workingProfessional4" />
    </Stack>
  )
}
