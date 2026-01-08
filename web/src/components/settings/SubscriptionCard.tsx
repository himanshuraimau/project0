"use client";

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
  const handleUpgrade = () => {
    // TODO: Navigate to pricing page
    window.location.href = "/pricing";
  };

  const leftFeatures = premiumFeatures.filter(f => f.column === "left");
  const rightFeatures = premiumFeatures.filter(f => f.column === "right");

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
          background: 'linear-gradient(135deg, #FAF5FF 0%, #EFF6FF 100%)',
          minHeight: '191.59px'
        }}
      >
        {/* Content Container */}
        <div className="flex items-start justify-between mb-6">
          {/* Left side content */}
          <div className="flex-1 max-w-[260.89px]">
            {/* Free Plan Badge */}
            <div 
              className="inline-block bg-white rounded-lg px-[6.42px] py-[1.99px] mb-3"
            >
              <span className="text-[12px] font-normal text-[#8200DB] leading-4">Free Plan</span>
            </div>

            {/* Plan Title */}
            <h3 className="text-[16px] font-normal text-[#0F172B] leading-6 mb-2">
              You're on the Free Plan
            </h3>

            {/* Description */}
            <p className="text-[16px] font-normal text-[#45556C] leading-6">
              Upgrade to unlock premium features
            </p>
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

        {/* Upgrade Button */}
        <button
          onClick={handleUpgrade}
          className="w-full h-9 rounded-lg text-white text-[14px] font-normal leading-5"
          style={{
            background: 'linear-gradient(90deg, #9810FA 0%, #155DFC 100%)'
          }}
        >
          Upgrade to Premium - $9.99/month
        </button>
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
        <h3 className="text-[18px] font-normal text-[#0F172B] dark:text-white mb-4 leading-[27px]">
          Billing History
        </h3>
        <p className="text-[16px] font-normal text-[#62748E] leading-6">
          No billing history yet
        </p>
      </div>
    </div>
  );
}
