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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 28,
    color: '#111827',
  },
  progressBarContainer: {
    flex: 1,
    paddingLeft: 8,
    paddingRight: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E9E3FF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressFill: {
    width: '45%',
    height: '100%',
    backgroundColor: '#7C3AED',
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
    marginBottom: 20,
  },
  list: {
    gap: 12,
  },
  fieldButton: {
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
  fieldButtonSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  fieldEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  fieldLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
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
