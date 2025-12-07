// Temporary debugging utility for OAuth issues
// Add this to your sign-in component for detailed debugging

export const debugOAuthResponse = (result: any) => {
  console.log('🐛 === OAUTH DEBUG START ===')
  console.log('🐛 Full result object:', JSON.stringify(result, null, 2))
  
  // Check all possible properties
  console.log('🐛 createdSessionId:', result.createdSessionId)
  console.log('🐛 setActive function:', typeof result.setActive)
  console.log('🐛 signIn object:', result.signIn)
  console.log('🐛 signUp object:', result.signUp)
  console.log('🐛 authSessionResult:', result.authSessionResult)
  
  // Check signIn properties if it exists
  if (result.signIn) {
    console.log('🐛 signIn.status:', result.signIn.status)
    console.log('🐛 signIn.createdSessionId:', result.signIn.createdSessionId)
    console.log('🐛 signIn properties:', Object.keys(result.signIn))
  }
  
  // Check signUp properties if it exists
  if (result.signUp) {
    console.log('🐛 signUp.status:', result.signUp.status)
    console.log('🐛 signUp.createdSessionId:', result.signUp.createdSessionId)
    console.log('🐛 signUp properties:', Object.keys(result.signUp))
  }
  
  console.log('🐛 === OAUTH DEBUG END ===')
}