import { StyleSheet } from 'react-native'

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 35,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 0,
    height: 76
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  progressContainer: {
    flex: 1
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 268435,
    overflow: 'hidden'
  },
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: '#9810FA',
    borderRadius: 268435
  },
  content: {
    paddingHorizontal: 19,
    paddingTop: 0,
    flex: 1
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0B0C10',
    marginBottom: 9,
    fontFamily: 'Arimo',
    lineHeight: 34,
    letterSpacing: -0.28
  },
  subtitle: {
    fontSize: 17,
    color: '#0B0C10',
    marginBottom: 24,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 22
  },
  features: {
    marginTop: 6
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingLeft: 13
  },
  checkContainer: {
    width: 24,
    height: 24,
    backgroundColor: '#E5F4F8',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  featureText: {
    fontSize: 16,
    color: '#0B0C10',
    flex: 1,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 22
  },
  footer: {
    paddingHorizontal: 25,
    paddingBottom: 20
  },
  continueButton: {
    width: 310,
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
  continueText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Arimo',
    lineHeight: 24,
    marginRight: 8
  },
})
