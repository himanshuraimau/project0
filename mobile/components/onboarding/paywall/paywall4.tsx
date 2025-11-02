import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

export default function Paywall4() {
  const router = useRouter()

  return (
    <LinearGradient colors={["#FFFFFF", "#F7F5FF"]} start={{ x: 1, y: 0 }} end={{ x: 0.3, y: 1 }} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.statusBar}>
        <View style={styles.timeBg}><Text style={styles.timeText}>4:23</Text></View>
        <View style={styles.statusRight}>
          <Ionicons name="wifi" size={16} color="#000" style={{ marginRight: 8 }} />
          <Ionicons name="battery-full" size={18} color="#000" />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.brandIcon}>
          <View style={styles.ghost} />
        </View>

        <Text style={styles.title}>Your space is set.</Text>
        <Text style={styles.subtitle}>Create an account to save your flow.</Text>

        <View style={styles.benefits}>
          <View style={styles.benefitRow}><Ionicons name="checkmark-circle" size={20} color="#7C3AED" style={{ marginRight: 8 }} /><Text style={styles.benefitText}>Preserve your personalized settings</Text></View>
          <View style={styles.benefitRow}><Ionicons name="checkmark-circle" size={20} color="#7C3AED" style={{ marginRight: 8 }} /><Text style={styles.benefitText}>Sync your notes seamlessly across devices</Text></View>
          <View style={styles.benefitRow}><Ionicons name="checkmark-circle" size={20} color="#7C3AED" style={{ marginRight: 8 }} /><Text style={styles.benefitText}>Access your ideas from anywhere, anytime</Text></View>
        </View>

        <TouchableOpacity style={styles.googleBtn} activeOpacity={0.9} onPress={() => {/* TODO: integrate */}}>
          <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }} style={styles.googleLogo} />
          <Text style={styles.googleText}>Sign up with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.appleBtn} activeOpacity={0.9} onPress={() => {/* TODO: integrate */}}>
          <Ionicons name="logo-apple" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.appleText}>Sign up with Apple</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>By creating an account you agree to our <Text style={styles.linkText}>privacy policy</Text> and <Text style={styles.linkText}>terms of service</Text>.</Text>
      </View>

      <View style={styles.homeIndicator} />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 18 },
  timeBg: { backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  timeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statusRight: { flexDirection: 'row', alignItems: 'center' },
  content: { paddingHorizontal: 24, paddingTop: 36, alignItems: 'center' },
  brandIcon: { width: 120, height: 120, borderRadius: 16, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  ghost: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#111827' },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16, textAlign: 'center' },
  benefits: { width: '100%', gap: 12, marginBottom: 20 },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  benefitText: { color: '#111827', fontSize: 14, flex: 1 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, width: '100%', justifyContent: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  googleLogo: { width: 20, height: 20, marginRight: 12 },
  googleText: { fontWeight: '700', color: '#111827' },
  appleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, width: '100%', justifyContent: 'center', marginBottom: 12 },
  appleText: { fontWeight: '700', color: '#fff' },
  termsText: { color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 8 },
  linkText: { textDecorationLine: 'underline', color: '#4B5563' },
  homeIndicator: { height: 4, width: 140, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
})
