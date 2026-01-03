import React from 'react';

const Header = ({ onHome }) => {
  
  // Helper to handle navigation clicks (About/Contact)
  const handleNavClick = (e, targetId) => {
    e.preventDefault(); // 1. Stop default jump (which fails if section is hidden)
    
    onHome(); // 2. Reset the view (Exit interview, show About/Contact sections)
    
    // 3. Wait a tiny bit for the sections to render, then scroll
    setTimeout(() => {
      const element = document.querySelector(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        // Update URL hash without jumping
        window.history.pushState(null, null, targetId);
      }
    }, 100);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md bg-black/20 border-b border-white/5 transition-all duration-300">
      
      {/* LOGO */}
      <button 
        onClick={onHome} 
        className="flex items-center gap-3 cursor-pointer group focus:outline-none"
        aria-label="Go to Home"
      >
        <span className="font-black text-xl tracking-wider text-white">
          MockMate <span className="text-indigo-500">AI</span>
        </span>
      </button>

      {/* MENU */}
      <nav className="flex items-center gap-8">
        
        {/* HOME BUTTON */}
        <button 
          onClick={onHome} 
          className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group focus:outline-none"
        >
          Home
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full"></span>
        </button>
        
        {/* ABOUT US BUTTON */}
        <a 
          href="#about" 
          onClick={(e) => handleNavClick(e, '#about')}
          className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group"
        >
          About Us
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full"></span>
        </a>
        
        {/* CONTACT US BUTTON */}
        <a 
          href="#contact" 
          onClick={(e) => handleNavClick(e, '#contact')}
          className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group"
        >
          Contact Us
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full"></span>
        </a>
      </nav>

    </header>
  );
};

export default Header;