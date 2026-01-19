import React from 'react';
import Link from 'next/link';
import { Zap, ArrowUpRight } from 'lucide-react';

interface SubscriptionCardProps {
    hasActiveSubscription: boolean;
    isLoading?: boolean;
    isDark?: boolean;
}

export function SubscriptionCard({ hasActiveSubscription, isLoading = false, isDark = false }: SubscriptionCardProps) {
    if (isLoading) {
        return null;
    }

    if (hasActiveSubscription) {
        return (
            <div className="w-full max-w-sm dark-gradient-element p-4 rounded-[16px]">
                <div className="mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-white font-medium">Premium Active</h3>
                    <p className="text-blue-100 text-sm">Enjoying unlimited access</p>
                </div>

                <a
                    href="/settings/subscription"
                    className="flex items-center text-sm justify-center w-full bg-white text-blue-600 rounded-[8px] px-4 py-2.5 transition-all duration-200 cursor-pointer font-semibold hover:bg-blue-50 hover:shadow-lg"
                >
                    Manage Plan
                </a>
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm dark-gradient-element p-4 rounded-[16px]">
            <div className="mb-4">
                <Zap className="w-6 h-6 text-white" />
            </div>

            <div className="mb-4">
                <h3 className="text-white font-medium">Upgrade to Pro</h3>
                <p className="text-blue-100 text-sm">Get unlimited access</p>
            </div>

            <a
                href="/pricing"
                className="flex items-center text-sm justify-center w-full bg-white text-blue-600 rounded-[8px] px-4 py-2 transition-all duration-200 cursor-pointer font-semibold hover:bg-blue-50 hover:shadow-lg"
            >
                Upgrade Now
            </a>
        </div>
    );
}

// Alternative version for CourseSideBar (black/white style)
export function SubscriptionCardAlt({ isDark = false }: { isDark?: boolean }) {
    return (
        <Link
            href="/pricing"
            className="flex items-center justify-between w-full bg-black dark:bg-[#F3F3F3] text-primary-foreground rounded-sm px-4 py-3 transition-all duration-200 cursor-pointer text-base font-semibold"
        >
            <div className="flex items-center gap-2">
                <span className="font-semibold text-white dark:text-black">
                    Upgrade to
                </span>
                <span className="bg-background text-foreground px-2 py-1 rounded-[0.4rem] text-sm font-bold">
                    PRO
                </span>
            </div>
            <ArrowUpRight
                className={`w-6 h-6 ${isDark ? 'text-black' : 'text-white'}`}
            />
        </Link>
    );
}
