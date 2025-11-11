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
  progressFill: { width: '65%', height: '100%', backgroundColor: PURPLE },
  scrollContent: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 10, fontFamily: theme.fontFamily.heading },
  subtitle: { color: '#7C3AED', fontSize: 14, marginBottom: 14, fontFamily: theme.fontFamily.heading },
  bullets: { marginTop: 8, gap: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'center' },
  checkWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  check: { color: '#10B981', fontWeight: '700' },
  bulletText: { flex: 1, fontSize: 16, color: '#111827' },
  footer: { paddingHorizontal: 20, paddingBottom: 12 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 8 },
  ctaArrow: { color: '#fff', fontSize: 18, fontWeight: '700' },
  rightGradient: { position: 'absolute', right: -40, top: 80, width: 220, height: 420, borderRadius: 220, backgroundColor: '#F5EEFF', opacity: 0.7, transform: [{ rotate: '25deg' }] },
  gesture: { height: 6, backgroundColor: '#E9E9EF', marginHorizontal: 110, borderRadius: 3, marginTop: 10, marginBottom: Platform.OS === 'ios' ? 16 : 8 },
})
