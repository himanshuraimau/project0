"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

const premiumFeatures = [
  { text: "Unlimited notes & folders", column: "left" },
  { text: "Advanced AI features", column: "right" },
  { text: "100 GB storage", column: "left" },
  { text: "Priority support", column: "right" },
  { text: "Custom themes", column: "left" },
  { text: "Collaboration tools", column: "right" },
  { text: "Export to all formats", column: "left" },
  { text: "No watermarks", column: "right" },
];

const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 1L6 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M11 6L1 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9.5 9.5L2.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 3L4.5 8.5L2 6" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9810FA" />
        <stop offset="100%" stopColor="#155DFC" />
      </linearGradient>
    </defs>
  </svg>
);

export function SubscriptionCard() {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionData(data);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  const handleUpgrade = () => {
    window.location.href = "/pricing";
  };

  const handleManageSubscription = () => {
    window.location.href = "/settings/subscription";
  };

  const handleCancelSubscription = async () => {
    if (confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      try {
        const response = await fetch('/api/subscription/cancel', {
          method: 'POST',
        });
        if (response.ok) {
          alert('Subscription cancelled successfully');
          window.location.reload();
        }
      } catch (error) {
        console.error('Error cancelling subscription:', error);
        alert('Failed to cancel subscription');
      }
    }
  };

  const leftFeatures = premiumFeatures.filter(f => f.column === "left");
  const rightFeatures = premiumFeatures.filter(f => f.column === "right");

  const hasActiveSubscription = subscriptionData?.hasSubscription && subscriptionData?.access?.hasAccess;

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-[#1A1A1A] rounded-[14px] p-8 w-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-12"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-12"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white/80 dark:bg-[#1A1A1A] rounded-[14px] p-8 w-full"
      style={{
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Header */}
      <h2 className="text-[16px] font-normal text-[#0F172B] dark:text-white mb-12">
        Subscription
      </h2>

      {/* Current Plan Card */}
      <div 
        className="relative rounded-2xl p-6 mb-12 flex flex-col"
        style={{
          background: hasActiveSubscription 
            ? 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 100%)' 
            : 'linear-gradient(135deg, #FAF5FF 0%, #EFF6FF 100%)',
          minHeight: '191.59px',
          border: hasActiveSubscription ? '2px solid transparent' : 'none',
          backgroundImage: hasActiveSubscription 
            ? 'linear-gradient(white, white), linear-gradient(135deg, #9810FA 0%, #155DFC 100%)'
            : 'none',
          backgroundOrigin: hasActiveSubscription ? 'border-box' : 'padding-box',
          backgroundClip: hasActiveSubscription ? 'padding-box, border-box' : 'padding-box',
        }}
      >
        {/* Content Container */}
        <div className="flex items-start justify-between mb-6">
          {/* Left side content */}
          <div className="flex-1">
            {/* Plan Badge */}
            <div 
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 mb-3 ${
                hasActiveSubscription 
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                  : 'bg-white'
              }`}
            >
              {hasActiveSubscription && (
                <span className="text-white text-base">✨</span>
              )}
              <span className={`text-[12px] font-semibold leading-4 ${
                hasActiveSubscription ? 'text-white' : 'text-[#8200DB]'
              }`}>
                {hasActiveSubscription ? 'Premium Plan' : 'Free Plan'}
              </span>
            </div>

            {/* Plan Title */}
            <h3 className="text-[18px] font-semibold text-[#0F172B] dark:text-white leading-6 mb-2">
              {hasActiveSubscription ? "Premium Active" : "You're on the Free Plan"}
            </h3>

            {/* Description/Stats */}
            {hasActiveSubscription ? (
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-[14px] text-[#45556C] dark:text-neutral-400">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 4V8L10.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Next billing: {new Date(subscriptionData.subscription.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-[14px] text-[#45556C] dark:text-neutral-400">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 5.33333V10.6667C14 11.0203 13.8595 11.3594 13.6095 11.6095C13.3594 11.8595 13.0203 12 12.6667 12H3.33333C2.97971 12 2.64057 11.8595 2.39052 11.6095C2.14048 11.3594 2 11.0203 2 10.6667V5.33333M14 5.33333C14 4.97971 13.8595 4.64057 13.6095 4.39052C13.3594 4.14048 13.0203 4 12.6667 4H3.33333C2.97971 4 2.64057 4.14048 2.39052 4.39052C2.14048 4.64057 2 4.97971 2 5.33333M14 5.33333L8.93333 8.6C8.65507 8.78885 8.33127 8.88917 8 8.88917C7.66873 8.88917 7.34493 8.78885 7.06667 8.6L2 5.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Status: <span className="font-semibold text-green-600">{subscriptionData.subscription.displayStatus}</span></span>
                </div>
              </div>
            ) : (
              <p className="text-[16px] font-normal text-[#45556C] dark:text-neutral-400 leading-6">
                Upgrade to unlock premium features
              </p>
            )}
          </div>

          {/* Logo */}
          <div 
            className="flex-shrink-0 w-12 h-12 rounded-[10px]"
            style={{
              background: 'linear-gradient(135deg, #9810FA 0%, #155DFC 100%)'
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 10C0 4.47715 4.47715 0 10 0H38C43.5229 0 48 4.47715 48 10V38C48 43.5229 43.5228 48 38 48H10C4.47715 48 0 43.5228 0 38V10Z" fill="url(#paint0_linear_166_1771)"/>
              <path d="M23.0174 14.814C23.0603 14.5846 23.182 14.3774 23.3615 14.2283C23.5411 14.0792 23.7671 13.9976 24.0004 13.9976C24.2338 13.9976 24.4598 14.0792 24.6393 14.2283C24.8189 14.3774 24.9406 14.5846 24.9834 14.814L26.0344 20.372C26.1091 20.7671 26.3011 21.1306 26.5855 21.4149C26.8698 21.6993 27.2333 21.8913 27.6284 21.966L33.1864 23.017C33.4158 23.0598 33.623 23.1815 33.7721 23.3611C33.9212 23.5406 34.0028 23.7666 34.0028 24C34.0028 24.2333 33.9212 24.4593 33.7721 24.6389C33.623 24.8184 33.4158 24.9401 33.1864 24.983L27.6284 26.034C27.2333 26.1086 26.8698 26.3006 26.5855 26.585C26.3011 26.8693 26.1091 27.2328 26.0344 27.628L24.9834 33.186C24.9406 33.4153 24.8189 33.6225 24.6393 33.7716C24.4598 33.9207 24.2338 34.0023 24.0004 34.0023C23.7671 34.0023 23.5411 33.9207 23.3615 33.7716C23.182 33.6225 23.0603 33.4153 23.0174 33.186L21.9664 27.628C21.8918 27.2328 21.6998 26.8693 21.4154 26.585C21.1311 26.3006 20.7676 26.1086 20.3724 26.034L14.8144 24.983C14.585 24.9401 14.3779 24.8184 14.2288 24.6389C14.0797 24.4593 13.998 24.2333 13.998 24C13.998 23.7666 14.0797 23.5406 14.2288 23.3611C14.3779 23.1815 14.585 23.0598 14.8144 23.017L20.3724 21.966C20.7676 21.8913 21.1311 21.6993 21.4154 21.4149C21.6998 21.1306 21.8918 20.7671 21.9664 20.372L23.0174 14.814Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 14V18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M34 16H30" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 34C17.1046 34 18 33.1046 18 32C18 30.8954 17.1046 30 16 30C14.8954 30 14 30.8954 14 32C14 33.1046 14.8954 34 16 34Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="paint0_linear_166_1771" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#9810FA"/>
                  <stop offset="1" stopColor="#155DFC"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Action Button */}
        {!hasActiveSubscription ? (
          <button
            onClick={handleUpgrade}
            className="w-full h-9 rounded-lg text-white text-[14px] font-normal leading-5"
            style={{
              background: 'linear-gradient(90deg, #9810FA 0%, #155DFC 100%)'
            }}
          >
            Upgrade to Premium - $9.99/month
          </button>
        ) : (
          <button
            onClick={handleCancelSubscription}
            className="w-full h-9 rounded-lg text-[14px] font-medium leading-5 border-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
          >
            Cancel Subscription
          </button>
        )}
      </div>

      {/* Premium Features */}
      <div className="mb-12">
        <h3 className="text-[16px] font-normal text-[#0F172B] dark:text-white mb-10">
          Premium Features
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-[36px]">
          {/* Left Column */}
          <div className="space-y-[36px]">
            {leftFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-[7px]">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                  <CheckIcon />
                </div>
                <span className="text-[16px] font-normal text-[#45556C] leading-6">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-[36px]">
            {rightFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-[7px]">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                  <CheckIcon />
                </div>
                <span className="text-[16px] font-normal text-[#45556C] leading-6">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(0,0,0,0.1)] dark:bg-neutral-700 mb-12"></div>

      {/* Billing History */}
      <div>
        <h3 className="text-[18px] font-normal text-[#0F172B] dark:text-white mb-6 leading-[27px]">
          Billing History
        </h3>
        {hasActiveSubscription && subscriptionData?.subscription ? (
          <div className="space-y-3">
            {/* Current Billing Cycle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[15px] font-medium text-[#0F172B] dark:text-white">
                    Current Billing Cycle
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[13px] text-[#62748E] dark:text-neutral-400">
                  Started: {new Date(subscriptionData.subscription.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[16px] font-semibold text-[#0F172B] dark:text-white">
                  $9.99
                </p>
                <p className="text-[12px] text-[#62748E] dark:text-neutral-400">
                  /month
                </p>
              </div>
            </div>

            {/* Next Billing */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-neutral-700">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[15px] font-medium text-[#0F172B] dark:text-white">
                    Next Payment
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                    UPCOMING
                  </span>
                </div>
                <p className="text-[13px] text-[#62748E] dark:text-neutral-400">
                  Due: {new Date(subscriptionData.subscription.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[16px] font-semibold text-[#0F172B] dark:text-white">
                  $9.99
                </p>
                <p className="text-[12px] text-[#62748E] dark:text-neutral-400">
                  /month
                </p>
              </div>
            </div>

            {/* Info Message */}
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <p className="text-[13px] text-blue-800 dark:text-blue-300">
                💳 Your payment method will be charged automatically on the next billing date.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11H15M9 15H12M21 8.5V16.5C21 17.0304 20.7893 17.5391 20.4142 17.9142C20.0391 18.2893 19.5304 18.5 19 18.5H5C4.46957 18.5 3.96086 18.2893 3.58579 17.9142C3.21071 17.5391 3 17.0304 3 16.5V8.5M21 8.5C21 7.96957 20.7893 7.46086 20.4142 7.08579C20.0391 6.71071 19.5304 6.5 19 6.5H5C4.46957 6.5 3.96086 6.71071 3.58579 7.08579C3.21071 7.46086 3 7.96957 3 8.5M21 8.5L13 13L5 8.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[16px] font-normal text-[#62748E] dark:text-neutral-400 leading-6">
              No billing history yet
            </p>
            <p className="text-[13px] text-[#62748E] dark:text-neutral-500 mt-1">
              Your payment history will appear here once you subscribe
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
