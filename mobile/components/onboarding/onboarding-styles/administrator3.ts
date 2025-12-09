import { StyleSheet, Platform } from 'react-native'

const PURPLE = '#7C3AED'
const BG = '#F7F5FF'

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60 },
  back: { fontSize: 22, marginRight: 12 },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 6, backgroundColor: '#EEE8FF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '100%', height: '100%', backgroundColor: PURPLE },
  content: { paddingHorizontal: 28, paddingTop: 18, flex: 1, width: '100%' },
  context: { color: PURPLE, fontSize: 15, fontWeight: '700', lineHeight: 22, marginBottom: 70, fontFamily: 'Arimo', width: '100%' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16, fontFamily: 'Arimo', width: '100%' },
  testimonialCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  nameSection: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardTitle: { fontSize: 14, color: '#6B7280' },
  starsContainer: { flexDirection: 'row', gap: 4 },
  star: { fontSize: 16 },
  quote: { fontSize: 15, fontWeight: '500', color: '#374151', lineHeight: 22, fontStyle: 'italic' },
  footer: { paddingHorizontal: 28, paddingBottom: 20 },
})
