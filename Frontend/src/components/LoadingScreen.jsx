import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    "Initializing Neural Networks...",
    "Calibrating Voice Engine...",
    "Loading Context Modules...",
    "Securing Connection...",
    "Preparing Interview Environment..."
  ];

  useEffect(() => {
    // 1. Progress Bar Timer
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Small delay before unmounting
          return 100;
        }
        // Randomize speed for realism
        const increment = Math.random() * 2 + 0.5; 
        return Math.min(prev + increment, 100);
      });
    }, 30);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    // 2. Message Cycler
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 800);

    return () => clearInterval(messageTimer);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center z-50 overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent animate-pulse-slow pointer-events-none"></div>

      {/* --- THE CORE ANIMATION --- */}
      <div className="relative w-32 h-32 mb-12">
        
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
        
        {/* Middle Ring (Reverse) */}
        <div className="absolute inset-3 rounded-full border-b-2 border-l-2 border-purple-500 animate-[spin_2s_linear_infinite_reverse]"></div>
        
        {/* Inner Core */}
        <div className="absolute inset-8 rounded-full bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] animate-pulse">
           <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
        </div>

        {/* Orbiting Particle */}
        <div className="absolute inset-0 animate-spin-slow">
           <div className="w-2 h-2 bg-cyan-400 rounded-full absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 shadow-[0_0_15px_cyan]"></div>
        </div>
      </div>

      {/* --- TEXT & PROGRESS --- */}
      <div className="w-64 flex flex-col items-center gap-4 relative z-10">
        
        {/* Main Title */}
        <h1 className="text-3xl font-black text-white tracking-wider">
          AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">INTERVIEWER</span>
        </h1>

        {/* Dynamic Status Text */}
        <div className="h-6">
          <p className="text-xs font-mono text-cyan-400/80 animate-fade-in uppercase tracking-widest">
            {messages[messageIndex]}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mt-4 relative">
          {/* Moving Bar */}
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transition-all duration-100 ease-out relative"
            style={{ width: `${progress}%` }}
          >
             {/* Glow at the tip of the bar */}
             <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white/50 to-transparent"></div>
          </div>
        </div>

        {/* Percentage */}
        <p className="text-gray-500 text-xs font-mono">{Math.floor(progress)}%</p>
      </div>
    </div>
  );
};

export default LoadingScreen;