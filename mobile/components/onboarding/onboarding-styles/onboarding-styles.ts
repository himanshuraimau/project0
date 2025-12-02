import { Platform, StyleSheet } from 'react-native'

export const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
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
    width: '20%',
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 20,
  },
  headerContainer: {
    marginBottom: 16,
  },
  subHeadingOnboarding: {
    fontSize: 15,
    fontFamily: 'Arimo',
    fontWeight: '700',
    lineHeight: 22,
    color: '#7C3AED',
    marginBottom: 8,
  },
  mainHeadingOnboarding: {
    fontSize: 21,
    fontWeight: '800',
    color: '#000000',
    lineHeight: 40,
  },
  optionsList: {
    gap: 12,
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
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0,
    flexGrow: 0,
  },
  optionText: {
    flex: 1,
    fontFamily: 'Arimo',
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

