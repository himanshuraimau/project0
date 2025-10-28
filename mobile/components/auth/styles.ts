import { StyleSheet } from 'react-native'

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  contentWrapper: {
    marginHorizontal: 16,
    gap: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  subHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 8,
  },
  mainHeading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  socialButtonWrapper: {
    marginTop: 8,
  },
  socialButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 0,
  },
  socialButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#9CA3AF',
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#FDFDFD',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 0,
  },
  input: {
    color: '#000000',
    fontSize: 16,
  },
  inputPlaceholder: {
    color: '#A0A0A0',
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 15,
  },
  footerLink: {
    color: '#7C3AED',
    fontSize: 15,
    fontWeight: '700',
  },
  clerkBranding: {
    alignItems: 'center',
    marginTop: 24,
  },
  clerkText: {
    color: '#B0B0B0',
    fontSize: 12,
  },
  verificationDescription: {
    color: '#6B7280',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
})

