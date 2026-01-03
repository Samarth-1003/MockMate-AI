import React, { useState, useEffect } from 'react';
import { InterviewProvider, useInterview } from './context/InterviewContext';
import SetupForm from './components/SetupForm';
import ChatInterface from './components/ChatInterface';
import ResultCard from './components/ResultCard';
import LoadingScreen from './components/LoadingScreen';
import Header from './components/Header';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';
import Footer from './components/Footer';

// --- Screen Manager ---
const ScreenManager = () => {
  const { step } = useInterview();
  switch (step) {
    case 'setup': return <SetupForm />;
    case 'chat':  return <ChatInterface />;
    case 'result': return <ResultCard />;
    default: return <SetupForm />;
  }
};

// --- Main Layout Component (The Form/Card) ---
const MainLayout = ({ isStarted, setIsStarted }) => {
  const { step } = useInterview();

  // Dynamic Card Sizing
  // 1. Setup: Increased size to max-w-2xl (was max-w-md)
  // 2. Chat/Result: Full width max-w-5xl
  const containerClasses = isStarted
    ? step === 'setup'
      ? 'w-full max-w-2xl h-auto' 
      : 'w-full max-w-5xl h-[85vh]'
    : 'w-0 h-0 opacity-0 overflow-hidden'; 

  return (
    <div className={`relative z-10 flex justify-center transition-all duration-1000 ease-in-out
      ${isStarted ? 'w-full items-center' : 'w-0 h-0'}
    `}>
      <div className={`transition-all duration-700 ease-in-out ${containerClasses}`}>
        {/* GLASS CARD STYLE FIX:
           - Changed 'bg-white/95' to 'bg-white/10' (Transparent)
           - Added 'backdrop-blur-md' (Blur Effect)
           - Added 'border border-white/20' (Glass Edge)
        */}
        <div className={`w-full h-full flex flex-col justify-center overflow-hidden transition-all duration-1000
            ${isStarted ? 'bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl' : 'opacity-0'}
        `}>
           <ScreenManager />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => { document.title = "MockMate AI"; }, []);

  const goHome = () => {
    setIsStarted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const InfoModal = ({ title, content, onClose }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white/10 border border-white/20 p-8 rounded-3xl max-w-lg w-full text-white shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-pink-300">{title}</h2>
        <p className="text-gray-300 leading-relaxed whitespace-pre-line">{content}</p>
      </div>
    </div>
  );

  if (isLoading) return <LoadingScreen onComplete={() => setIsLoading(false)} />;

  return (
    <InterviewProvider>
      <div className="w-full h-screen overflow-y-auto overflow-x-hidden bg-[#0f172a] scroll-smooth relative">
        
        <Header onHome={goHome} />

        {/* --- HERO SECTION --- */}
        <section id="home" className="relative w-full min-h-screen flex pt-20">
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-50 animate-pulse-slow pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mix-blend-multiply filter blur-3xl opacity-30"></div>
                <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-gradient-to-br from-blue-500 via-teal-500 to-green-500 mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            </div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>

            {/* 1. HERO TEXT */}
            <div className={`relative z-10 flex flex-col justify-center items-center text-center px-4 transition-all duration-1000 ease-in-out
               ${isStarted ? 'w-0 opacity-0 px-0 overflow-hidden absolute' : 'w-full opacity-100'}
            `}>
              <div className="space-y-8 max-w-3xl mx-auto flex flex-col items-center">
                <div className="inline-flex gap-2">
                    <span className="px-3 py-1 text-xs font-medium text-indigo-200 bg-indigo-500/20 rounded-full backdrop-blur-md border border-indigo-500/30">✨ AI-Powered</span>
                    <span className="px-3 py-1 text-xs font-medium text-purple-200 bg-purple-500/20 rounded-full backdrop-blur-md border border-purple-500/30">🚀 Real-time feedback</span>
                </div>
                <h1 className="text-6xl md:text-7xl font-black text-white leading-tight drop-shadow-sm">
                  Ace Your <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-pink-300">Tech Interview</span>
                </h1>
                <p className="text-xl text-indigo-100/80 leading-relaxed max-w-xl font-medium">
                  Upload your resume and let <span className="text-white font-bold">MockMate AI</span> conduct a realistic technical interview tailored just for you.
                </p>
                <button onClick={() => setIsStarted(true)} className="group flex items-center gap-4 bg-white text-indigo-900 border border-white/20 px-10 py-5 rounded-full font-bold text-xl hover:bg-indigo-50 hover:scale-105 shadow-xl shadow-indigo-500/20 transition-all mt-4">
                  <span>Let's Start</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>

            {/* 2. FORM INTERFACE (Glass Card) */}
            <MainLayout isStarted={isStarted} setIsStarted={setIsStarted} />
        </section>

        {/* --- ADDITIONAL SECTIONS --- */}
        {!isStarted && (
          <>
            <AboutUs />
            <ContactUs />
            <Footer onHome={goHome} />
          </>
        )}

        {/* --- MODALS --- */}
        {activeModal === 'contact' && (
          <InfoModal 
            title="Contact Us" 
            content={`Have questions? Email us at:\nsupport@mockmate.ai\n\nOr find us at:\nTech Hub, Gandhinagar, India.`}
            onClose={() => setActiveModal(null)} 
          />
        )}
      </div>
    </InterviewProvider>
  );
}