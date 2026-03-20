import { Platform, StyleSheet } from 'react-native'

export const onboardingStep3Styles = StyleSheet.create({
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
    width: '75%',
    height: '100%',
    backgroundColor: '#4f3be7',
    borderRadius: 20,
  },
  headerContainer: {
    marginBottom: 48,
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
  optionsList: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 83,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 21,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1.46,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  optionCardSelected: {
    borderColor: '#4f3be7',
    backgroundColor: 'rgba(245, 243, 255, 0.9)',
  },
  emojiSquircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 3,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 32,
  },
  textContainer: {
    flex: 1,
    paddingTop: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 24,
    marginBottom: 0,
  },
  optionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4A5565',
    lineHeight: 22.75,
  },
  continueButtonContainer: {
    marginTop: 32,
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

