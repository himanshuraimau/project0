import { Platform, StyleSheet } from 'react-native'

const PURPLE = '#4f3be7'
const BG = '#FFFFFF'

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  statusBar: {
    height: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter' },
  statusIcons: { flexDirection: 'row' },
  icon: { marginLeft: 8, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60 },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 6, backgroundColor: '#EEE8FF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '20%', height: '100%', backgroundColor: PURPLE },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '500', color: '#0F172A', marginBottom: 8, fontFamily: 'Inter' },
  subtitle: {
    fontSize: 17,
    lineHeight: 22,
    color: '#0B0C10',
    marginBottom: 40,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  subtitleBold: { fontWeight: '500' },
  features: { marginTop: 0, paddingLeft: 7 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 19,
  },
  check: {
    width: 24,
    height: 24,
    backgroundColor: '#E5F4F8',
    borderRadius: 14,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#0B0C10',
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  footer: { paddingHorizontal: 16, paddingBottom: 40 },
  continueButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14 },
  continueText: { color: '#FFF', fontSize: 16, fontWeight: '500', marginRight: 8, fontFamily: 'Inter' },
  continueArrow: { color: '#FFF', fontSize: 18, fontWeight: '500' },
  gesture: { height: 6, backgroundColor: '#E5E7EB', marginHorizontal: 120, borderRadius: 3, marginTop: 8 },
})
