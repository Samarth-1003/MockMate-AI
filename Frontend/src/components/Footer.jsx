import React from 'react';

const Footer = ({ onHome }) => {
  return (
    <footer className="bg-black text-gray-400 py-16 border-t border-white/10 relative overflow-hidden font-sans">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>

      <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center relative z-10">
        
        {/* BRAND LOGO - Larger Size */}
        <div 
          onClick={onHome} 
          className="flex items-center gap-4 cursor-pointer mb-6 group"
        >
          {/* Increased Text Size */}
          <span className="text-white font-black text-3xl tracking-wider">
            MockMate <span className="text-indigo-500">AI</span>
          </span>
        </div>

        {/* DESCRIPTION - Larger Font */}
        <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mb-10">
          Empowering job seekers with AI-driven interview simulations. <br className="hidden md:block" />
          Practice anytime, anywhere, and get hired faster.
        </p>

      </div>

      {/* COPYRIGHT BAR - Centered */}
      <div className="max-w-4xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col items-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} MockMate AI. All rights reserved.</p>
        <p className="mt-2 font-medium text-gray-400">Made in India 🇮🇳</p>
      </div>

    </footer>
  );
};

export default Footer;