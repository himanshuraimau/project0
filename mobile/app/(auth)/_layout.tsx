import { Redirect, Stack } from 'expo-router'
import { useSession } from '@/lib/auth'

export default function AuthRoutesLayout() {
  const { data: session } = useSession()

  if (session) {
    return <Redirect href={'/(home)' as any} />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false, 
      }}
    />
  )
}