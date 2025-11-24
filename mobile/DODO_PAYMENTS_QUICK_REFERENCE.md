# Dodo Payments Integration - Quick Reference

## 🚀 Quick Start

### 1. Update Plan IDs (REQUIRED)

Edit `/home/nyx/Projects/project0/mobile/app/(onboarding)/paywall/paywall5.tsx`:

```typescript
const PLANS = [
  {
    id: 'YOUR_MONTHLY_PLAN_ID_FROM_DODO',  // Line 28
    // ...
  },
  {
    id: 'YOUR_YEARLY_PLAN_ID_FROM_DODO',   // Line 37
    // ...
  },
];
```

### 2. Navigate to Paywall After Login

```typescript
import { useRouter } from 'expo-router';

// After successful login
router.push('/(onboarding)/paywall/paywall5');
```

### 3. Use Subscription Hook Anywhere

```typescript
import { useSubscription } from '@/lib/contexts/SubscriptionContext';

const { isSubscribed, subscription, refreshSubscription } = useSubscription();
```

---

## 📱 Test Deep Links

**iOS**:
```bash
xcrun simctl openurl booted "mobile://payment-status?status=success&session_id=test123"
```

**Android**:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "mobile://payment-status?status=success&session_id=test123" com.kjish.mobile
```

---

## ✅ What's Done

- ✅ Installed `react-native-inappbrowser-reborn`
- ✅ Updated subscription types
- ✅ Created SubscriptionContext
- ✅ Created PaywallScreen (paywall5.tsx)
- ✅ Configured Android deep links
- ✅ Configured iOS deep links
- ✅ Wrapped app with SubscriptionProvider

---

## ⚠️ Before Testing

1. **Replace placeholder plan IDs** in paywall5.tsx
2. **Ensure backend is running** at EXPO_PUBLIC_API_URL
3. **Verify user data** (email, name) is saved to AsyncStorage on login
4. **Configure Dodo webhooks** for subscription status updates

---

## 📂 Key Files

- **Paywall Screen**: `app/(onboarding)/paywall/paywall5.tsx`
- **Context**: `lib/contexts/SubscriptionContext.tsx`
- **Types**: `lib/api/types.ts`
- **API**: `lib/api/subscription.ts` (already existed)
- **Layout**: `app/_layout.tsx` (wrapped with provider)

---

## 🎯 Deep Link URLs

- Success: `mobile://payment-status?status=success&session_id=xxx`
- Cancel: `mobile://payment-status?status=canceled`
