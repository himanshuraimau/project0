import { StyleSheet } from 'react-native'

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60 },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 6, backgroundColor: '#EEE8FF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '50%', height: '100%', backgroundColor: '#7C3AED' },
  content: {
    paddingHorizontal: 28,
    paddingTop: 20,
    flex: 1,
    width: '100%'
  },
  mainQuestion: {
    marginTop: 16,
    marginBottom: 32,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Arimo',
    lineHeight: 32,
    color: '#0A0A0A',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    height: 61.6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: '#E5E7EB',
    borderRadius: 14,
  },
  optionButtonSelected: {
    borderColor: '#9810FA',
    borderWidth: 2,
  },
  optionIcon: {
    fontSize: 20,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 28,
    color: '#0A0A0A',
    width: 27.46,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 24,
    color: '#101828',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  continueButton: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    shadowColor: 'rgba(76, 87, 255, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Arimo',
    lineHeight: 24,
    marginRight: 8
  },
  optionOverride: { height: 70 },
})
