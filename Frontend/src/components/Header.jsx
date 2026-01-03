import React from 'react';

const Header = ({ onHome }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md bg-black/20 border-b border-white/5 transition-all duration-300">
      
      {/* LOGO */}
      <div onClick={onHome} className="flex items-center gap-3 cursor-pointer group">
        
        {/* 1. Uncommented and Fixed Size (w-10 h-10) */}
        <img 
          src="/logo.png" 
          alt="MockMate Logo" 
          className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
        />
        
        <span className="text-white font-black text-xl tracking-wider hidden md:block">
          MockMate <span className="text-indigo-400">AI</span>
        </span>
      </div>

      {/* MENU */}
      <nav className="flex items-center gap-8">
        <button onClick={onHome} className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group">
          Home
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full"></span>
        </button>
        
        <a href="#about" className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group">
          About Us
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full"></span>
        </a>
        
        <a href="#contact" className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group">
          Contact Us
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full"></span>
        </a>
      </nav>

    </header>
  );
};

export default Header;