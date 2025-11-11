import { StyleSheet, Platform } from 'react-native'
import { BrutalistTheme } from '@/lib/theme/types'

const PURPLE = '#7C3AED'
const BG = '#FFFFFF'

export default (theme: BrutalistTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  statusBar: {
    height: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeWrap: { backgroundColor: '#FF4D4F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  time: { color: '#fff', fontWeight: '700', fontFamily: theme.fontFamily.default, fontSize: 13 },
  statusIcons: { flexDirection: 'row' },
  icon: { marginLeft: 8, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  back: { fontSize: 22, marginRight: 12 },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 10, backgroundColor: '#F3EFFF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '92%', height: '100%', backgroundColor: PURPLE },
  scrollContent: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },
  context: { color: '#7C3AED', fontSize: 13, fontWeight: '500', marginBottom: 8, fontFamily: theme.fontFamily.default },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16, fontFamily: theme.fontFamily.heading },
  options: { marginTop: 6, gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F0EEF8', marginBottom: 12 },
  optionSelected: { borderColor: PURPLE, backgroundColor: '#FBF7FF' },
  optionIcon: { fontSize: 18, marginRight: 12, width: 28, textAlign: 'center' },
  optionLabel: { fontSize: 16, color: '#111827', flex: 1, fontFamily: theme.fontFamily.default },
  footer: { paddingHorizontal: 20, paddingBottom: 14 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E6E6F0' },
  ctaText: { color: '#111827', fontSize: 16, fontWeight: '700', marginRight: 8 },
  ctaArrow: { color: '#111827', fontSize: 18, fontWeight: '700' },
  leftGradient: { position: 'absolute', left: -40, top: 80, width: 220, height: 420, borderRadius: 220, backgroundColor: '#F5EEFF', opacity: 0.7, transform: [{ rotate: '-25deg' }] },
  homeIndicator: { height: 6, backgroundColor: '#E9E9EF', marginHorizontal: 110, borderRadius: 3, marginTop: 10, marginBottom: Platform.OS === 'ios' ? 24 : 8 },
})
