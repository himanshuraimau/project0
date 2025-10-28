import { Dimensions, Platform, StyleSheet } from 'react-native'

const { height } = Dimensions.get('window')

export const onboardingStep2Styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: height - (Platform.OS === 'ios' ? 60 : 40),
  },
  progressBarContainer: {
    marginBottom: 32,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E9E3FF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '45%',
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 20,
  },
  headerContainer: {
    marginBottom: 32,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 8,
  },
  mainHeading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
    lineHeight: 40,
  },
  spacer: {
    flex: 1,
    minHeight: 120,
  },
  optionsList: {
    gap: 16,
    marginTop: 'auto',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: '#171717',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  checkmarkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E9E3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  recordButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DC2626',
  },
  continueButtonContainer: {
    marginTop: 24,
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

