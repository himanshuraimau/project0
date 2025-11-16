import { StyleSheet } from 'react-native'
import { BrutalistTheme } from '@/lib/theme/types'

export default (theme: BrutalistTheme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5FF' },
  statusBar: { height: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 6 },
  time: { fontSize: 14, color: '#0F172A', fontWeight: '600', fontFamily: theme.fontFamily.default },
  statusRight: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { fontSize: 13 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 12 },
  back: { fontSize: 22, marginRight: 16, color: '#0F172A' },
  progressContainer: { flex: 1 },
  progressTrack: { height: 6, backgroundColor: '#E6E7F0', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '35%', height: '100%', backgroundColor: '#7C3AED' },
  content: { paddingHorizontal: 24, paddingTop: 20, flex: 1 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A', marginBottom: 6, fontFamily: theme.fontFamily.heading },
  subtitle: { fontSize: 15, color: '#374151', marginBottom: 18, fontFamily: theme.fontFamily.heading },
  features: { marginTop: 6 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  check: { fontSize: 18, color: '#60A5FA', marginRight: 12, marginTop: 2 },
  featureText: { fontSize: 16, color: '#0F172A', flex: 1 },
  footer: { paddingHorizontal: 24, paddingBottom: 18 },
  continueButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14 },
  continueText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginRight: 8, fontFamily: theme.fontFamily.default },
  continueArrow: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  gestureBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 8, marginHorizontal: 120 },
})
