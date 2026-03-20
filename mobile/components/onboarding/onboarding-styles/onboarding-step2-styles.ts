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
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: height - (Platform.OS === 'ios' ? 80 : 60),
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
    backgroundColor: '#4f3be7',
    borderRadius: 20,
  },
  headerContainer: {
    marginBottom: 32,
  },
  subHeading: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '500',
    lineHeight: 22,
    color: '#4f3be7',
    marginBottom: 8,
  },
  mainHeading: {
    fontSize: 21,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 40,
  },
  spacer: {
    flex: 1,
    minHeight: 280,
  },
  optionsList: {
    gap: 16,
    marginTop: 'auto',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    paddingLeft: 16,
    gap: 16,
    width: '100%',
    height: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: '#4f3be7',
    backgroundColor: '#F5F3FF',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 0,
  },
  optionText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 26,
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
    marginRight: 16,
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
    backgroundColor: '#4f3be7',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f3be7',
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
    fontWeight: '500',
  },
})

