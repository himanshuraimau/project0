import { StyleSheet } from 'react-native'

const PURPLE = '#4f3be7'
const BG = '#F8F8FA'

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60 },
  back: { fontSize: 22, marginRight: 12 },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 6, backgroundColor: '#EEE8FF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '66%', height: '100%', backgroundColor: PURPLE },
  content: { paddingHorizontal: 16, paddingTop: 18, flex: 1, width: '100%' },
  context: { color: PURPLE, fontSize: 15, fontWeight: '500', lineHeight: 22, marginBottom: 8, fontFamily: 'Inter', width: '100%' },
  title: { fontSize: 22, fontWeight: '500', marginBottom: 16, fontFamily: 'Inter', width: '100%' },
  options: { marginTop: 6, gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E6E6F0', marginBottom: 12 },
  optionIcon: { fontSize: 18, marginRight: 12 },
  optionLabel: { fontSize: 16, color: '#111827', flex: 1, fontFamily: 'Inter' },
  footer: { paddingHorizontal: 16, paddingBottom: 40 },
  continueWrap: { borderRadius: 14, overflow: 'hidden' },
  continueButton: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E6E6E6' },
  continueText: { fontSize: 16, fontWeight: '500', color: '#000' },
  optionSelected: { borderColor: PURPLE, backgroundColor: '#f7f9ff' },
  optionOverride: { height: 70 },
})
