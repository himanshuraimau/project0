"use client";

import { dark } from "@clerk/themes";
import { useCurrentTheme } from "@/hooks/use-current-theme";
import { UserButton } from "@clerk/nextjs";

interface Props {
    showName?: boolean;
}

export const UserControl = ({ showName }: Props) => {
    const currentTheme = useCurrentTheme();

    return (
        <UserButton 
            showName={showName}
            appearance={{
                elements: {
                    userButtonBox: "rounded-md! flex items-center space-x-2!", // Flex container with space
                    userButtonAvatarBox: "rounded-md! size-8! order-first", // Ensure avatar comes first
                    userButtonTrigger: "rounded-md!",
                },
                baseTheme: currentTheme === "dark" ? dark : undefined,
            }}
        />
    );
};
