import { StyleSheet, Platform } from 'react-native'

const PURPLE = '#7C3AED'
const BG = '#F8F8FA'

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60 },
  back: { fontSize: 22, marginRight: 12 },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 6, backgroundColor: '#EEE8FF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '66%', height: '100%', backgroundColor: PURPLE },
  content: { paddingHorizontal: 28, paddingTop: 18, flex: 1, width: '100%' },
  context: { color: PURPLE, fontSize: 15, fontWeight: '700', lineHeight: 22, marginBottom: 8, fontFamily: 'Arimo', width: '100%' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16, fontFamily: 'Arimo', width: '100%' },
  options: { marginTop: 6, gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E6E6F0', marginBottom: 12 },
  optionIcon: { fontSize: 18, marginRight: 12 },
  optionLabel: { fontSize: 16, color: '#111827', flex: 1, fontFamily: 'Arimo' },
  footer: { paddingHorizontal: 28, paddingBottom: 20 },
  continueWrap: { borderRadius: 14, overflow: 'hidden' },
  continueButton: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E6E6E6' },
  continueText: { fontSize: 16, fontWeight: '700', color: '#000' },
  optionSelected: { borderColor: PURPLE, backgroundColor: '#FBF7FF' },
  optionOverride: { height: 70 },
})
