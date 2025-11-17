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
  progressFill: { width: '100%', height: '100%', backgroundColor: PURPLE },
  content: { paddingHorizontal: 20, paddingTop: 18, flex: 1, alignItems: 'center' },
  context: { 
    color: '#7C3AED', 
    fontSize: 15, 
    fontFamily: 'Arimo',
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 6, fontFamily: theme.fontFamily.heading, alignSelf: 'flex-start' },
  gpaWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 24, justifyContent: 'center' },
  gpaButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 },
  gpaButtonText: { fontSize: 32, color: '#111827', fontWeight: '700' },
  gpaValueWrap: { minWidth: 120, alignItems: 'center', justifyContent: 'center' },
  gpaValue: { fontSize: 48, color: PURPLE, fontWeight: '800' },
  footer: { paddingHorizontal: 20, paddingBottom: 18 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 8 },
  ctaArrow: { color: '#fff', fontSize: 18, fontWeight: '700' },
  leftGradient: { position: 'absolute', left: -40, top: 80, width: 220, height: 420, borderRadius: 220, backgroundColor: '#F5EEFF', opacity: 0.7, transform: [{ rotate: '-25deg' }] },
  homeIndicator: { height: 6, backgroundColor: '#E9E9EF', marginHorizontal: 110, borderRadius: 3, marginTop: 10, marginBottom: Platform.OS === 'ios' ? 24 : 8 },
})
