"use client";

import { Header } from "@/components/landing/header";
import { AuthLoadingWrapper } from "@/components/auth/auth-loading";
import { useTheme } from "next-themes";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const colors = {
    bg: isDark ? '#000000' : '#ffffff',
    grid: isDark ? '#262626' : '#e5e5e5',
    gridOpacity: isDark ? 0.2 : 0.3,
    text: isDark ? '#ffffff' : '#000000',
  };

  return (
    <AuthLoadingWrapper>
      {/* 1. Base Layer */}
      <div 
        className="fixed inset-0 -z-50 h-full w-full"
        style={{ backgroundColor: colors.bg }}
      />

      {/* 2. Grid Texture */}
      <div 
        className="fixed inset-0 -z-40 h-full w-full pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, ${colors.grid} 1px, transparent 1px), linear-gradient(to bottom, ${colors.grid} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: colors.gridOpacity,
        }}
      />

      <div 
        className="flex flex-col min-h-screen font-sans antialiased"
        style={{ color: colors.text }}
      >
        <Header />
        <main className="flex-1 flex flex-col relative">{children}</main>
      </div>
    </AuthLoadingWrapper>
  );
};

export default Layout;