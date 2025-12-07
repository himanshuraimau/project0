import { Dimensions, Platform, StyleSheet } from 'react-native'

const { height } = Dimensions.get('window')

export const workingProfessionalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: height - (Platform.OS === 'ios' ? 60 : 40),
  },
  statusBar: {
    height: 44,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  time: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#111827',
    marginRight: 8,
  },
  battery: {
    width: 24,
    height: 12,
    borderWidth: 1.5,
    borderColor: '#111827',
    borderRadius: 2,
  },
  headerContainer: {
    marginBottom: 24,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60 },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 6, backgroundColor: '#EEE8FF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '25%', height: '100%', backgroundColor: '#7C3AED' },
  subHeading: {
    fontSize: 15,
    fontFamily: 'Arimo',
    fontWeight: '700',
    lineHeight: 22,
    color: '#7C3AED',
    marginBottom: 8,
  },
  mainHeading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
    lineHeight: 40,
    marginBottom: 20,
  },
  list: {
    gap: 12,
  },
  fieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 0,
    gap: 12,
    height: 57.6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0.8,
    borderColor: '#E5E7EB',
  },
  fieldButtonSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  fieldEmoji: {
    fontSize: 20,
    width: 24,
    height: 24,
    textAlign: 'center',
  },
  fieldLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#101828',
    lineHeight: 24,
  },
  gestureBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 120,
    borderRadius: 4,
    marginBottom: 16,
  },
  continueButtonContainer: {
    marginTop: 32,
  },
  continueButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
})
