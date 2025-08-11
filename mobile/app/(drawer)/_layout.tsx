import React from 'react'
import { Drawer } from 'expo-router/drawer'
import { useTheme } from '@/lib/hooks/useTheme'
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer'
import { Text, View } from 'react-native'

export default function DrawerLayout() {
  const { theme } = useTheme()
  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        drawerStyle: { backgroundColor: theme.colors.background },
        drawerContentContainerStyle: { paddingVertical: theme.spacing.md },
        drawerLabelStyle: { fontWeight: '600', fontSize: theme.fontSize.sm },
        drawerItemStyle: {
          borderColor: theme.colors.border,
          borderWidth: theme.borderWidth.brutal,
          borderRadius: theme.radius.brutal,
          marginHorizontal: theme.spacing.md,
          marginVertical: theme.spacing.xs,
          ...theme.shadow({ offset: 3, opacity: 0.25 }),
        },
        drawerInactiveBackgroundColor: theme.colors.surface,
        drawerActiveBackgroundColor: theme.colors.primary,
        drawerActiveTintColor: theme.colors.primaryText,
        drawerInactiveTintColor: theme.colors.text,
      }}
      drawerContent={(props) => (
        <DrawerContentScrollView
          {...props}
          contentContainerStyle={{ paddingTop: theme.spacing.xl }}
        >
          <View style={{ paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.lg }}>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.fontSize['2xl'],
                fontWeight: '800',
                letterSpacing: 0.2,
              }}
            >
              project0
            </Text>
          </View>
          <DrawerItemList {...props} />
        </DrawerContentScrollView>
      )}
    >
      {/* Route group entry points become drawer items via file-based routing */}
      <Drawer.Screen
        name="(home)"
        options={{ title: 'Home' }}
      />
    </Drawer>
  )
}


