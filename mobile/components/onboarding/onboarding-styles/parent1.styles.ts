import { StyleSheet, Platform } from 'react-native'

const PURPLE = '#7C3AED'
const BG = '#F7F5FF'

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  statusBar: {
    height: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: { fontSize: 14, fontWeight: '600' },
  statusIcons: { flexDirection: 'row' },
  icon: { marginLeft: 8, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  back: { fontSize: 22, marginRight: 12 },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 6, backgroundColor: '#EEE8FF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '50%', height: '100%', backgroundColor: PURPLE },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#374151', marginBottom: 16 },
  subtitleBold: { fontWeight: '700' },
  features: { marginTop: 6 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  check: { fontSize: 18, color: '#60A5FA', marginRight: 12, marginTop: 2 },
  featureText: { fontSize: 16, color: '#0F172A', flex: 1 },
  footer: { paddingHorizontal: 20, paddingBottom: 18 },
  continueButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14 },
  continueText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginRight: 8 },
  continueArrow: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  gesture: { height: 6, backgroundColor: '#E5E7EB', marginHorizontal: 120, borderRadius: 3, marginTop: 8 },
})
