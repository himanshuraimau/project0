import { StyleSheet, Platform } from 'react-native'

const PURPLE = '#7C3AED'
const BG = '#F8F8FA'

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60 },
  back: { fontSize: 22, marginRight: 12 },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 6, backgroundColor: '#EEE8FF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '33%', height: '100%', backgroundColor: PURPLE },
  content: { paddingHorizontal: 16, paddingTop: 18, flex: 1 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8, fontFamily: 'Arimo' },
  subtitle: { color: '#0B0C10', fontSize: 17, lineHeight: 22, marginBottom: 24, fontFamily: 'Arimo', fontWeight: '400' },
  features: { marginTop: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 19 },
  checkContainer: {
    width: 24,
    height: 24,
    backgroundColor: '#E5F4F8',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: { fontSize: 16, lineHeight: 22, color: '#0B0C10', fontFamily: 'Arimo', flex: 1 },
  footer: { paddingHorizontal: 16, paddingBottom: 20 },
})
