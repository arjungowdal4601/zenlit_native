'use client';
import { useAnimatedRouter } from './PageTransition';
import { useState } from 'react';

export default function GetStarted() {
  const { animatedPush, isNavigating } = useAnimatedRouter();
  const [isClicked, setIsClicked] = useState(false);

  const handleGetStarted = () => {
    setIsClicked(true);
    // Use smooth swipe animation to the right for sign-up flow
    animatedPush('/auth/signup', { 
      direction: 'left', 
      duration: 400 
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className={`text-center transition-all duration-500 ease-out transform ${
        isClicked ? 'scale-95 opacity-80 -translate-y-2' : 'scale-100 opacity-100 translate-y-0'
      }`}>
        <h1 
          className="text-5xl md:text-7xl lg:text-8xl mb-12 tracking-tight font-medium"
          style={{
            backgroundImage: 'linear-gradient(to right, #2563eb, #7e22ce)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            fontFamily: 'var(--font-inter)'
          }}
        >
          Zenlit
        </h1>
        
        <button
          onClick={handleGetStarted}
          disabled={isNavigating || isClicked}
          className={`bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-medium px-10 py-4 rounded-xl transition-all duration-300 transform shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed ${
            isClicked || isNavigating 
              ? 'scale-95 translate-y-1' 
              : 'hover:scale-105 hover:-translate-y-0.5'
          }`}
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {isNavigating || isClicked ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </div>
          ) : (
            'Get Started'
          )}
        </button>
      </div>
    </div>
  );
}

