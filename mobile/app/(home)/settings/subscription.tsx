import { View, StyleSheet } from 'react-native'
import SubscriptionManager from '@/components/home/settings/SubscriptionManager'

export default function SubscriptionPage() {
  return (
    <View style={styles.container}>
      <SubscriptionManager />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
