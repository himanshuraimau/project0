"use client";

import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  title?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ title = "Creating your quiz" }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#F4F5FA] dark:bg-black h-screen w-screen flex justify-center items-center z-50">
      <div className="text-center flex flex-col items-center">
        {/* Mascot Image */}
        <div className="mb-6">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-[140px] h-auto rounded-2xl animate-[breathe_3s_ease-in-out_infinite]"
          />
        </div>
        
        {/* Title */}
        <h1 className="text-2xl text-[#2D2D2D] dark:text-white font-bold mb-3">
          {title}{dots}
        </h1>
        
        {/* Subtitle */}
        <p className="text-base text-[#9CA3AF] font-medium">
          This will just take a moment
        </p>
      </div>

      <style jsx>{`
        @keyframes breathe {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
