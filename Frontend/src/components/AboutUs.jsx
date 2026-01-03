import React from 'react';

const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition-all duration-300 group">
    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-300 mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

const AboutUs = () => {
  return (
    <section id="about" className="relative w-full py-24 px-6 md:px-12 bg-[#0b1120]">
      
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <span className="text-indigo-400 font-bold tracking-widest text-xs uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          Why Choose Us
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-white mt-6 mb-6">
          Beyond Standard <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Mock Interviews
          </span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          MockMate AI isn't just a chatbot. It's a comprehensive interview simulation engine designed to mimic the pressure, logic, and flow of real technical rounds.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
        <FeatureCard 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          title="Resume Analysis"
          desc="Our engine scans your PDF resume to extract key skills and generates questions specifically tailored to your experience level."
        />
        <FeatureCard 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
          title="Human-like Voice"
          desc="Speak naturally. Our Voice AI listens, understands context, and responds with a natural tone—just like a real recruiter."
        />
        <FeatureCard 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          title="Instant Feedback"
          desc="Get immediate insights on your answers. We analyze your confidence, technical accuracy, and communication style."
        />
      </div>

      {/* Decorative Gradients */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

    </section>
  );
};

export default AboutUs;