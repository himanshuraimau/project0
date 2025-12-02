import { Stack } from 'expo-router'

export default function TeacherFlowLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="teacher1" />
      <Stack.Screen name="teacher2" />
      <Stack.Screen name="teacher3" />
      <Stack.Screen name="teacher4" />
    </Stack>
  )
}
