import React, { useState } from 'react';
import { useInterview } from '../context/InterviewContext';
import { apiService } from '../services/api';

const SetupForm = () => {
  const { setQuestionList, setCurrentIndex, setMessages, setStep, setCandidateName, candidateName } = useInterview();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jd, setJd] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setResumeFile(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    if (!jd || !resumeFile || !firstName || !lastName) return;
    setLoading(true);

    try {
      const data = await apiService.generateQuestions(resumeFile, jd);
      if (data.questions && data.questions.length > 0) {
        setCandidateName(firstName);
        const personalizedQuestions = data.questions.map((q, index) => {
          if (index === 0) return `${firstName}, ${q.charAt(0).toLowerCase() + q.slice(1)}`;
          if (Math.random() > 0.7) return `${firstName}, ${q.charAt(0).toLowerCase() + q.slice(1)}`;
          return q;
        });
        setQuestionList(personalizedQuestions);
        setCurrentIndex(0);
        setAnalysisComplete(true);
      } else {
        alert("No questions received.");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const startSession = (mode) => {
    sessionStorage.setItem('interviewMode', mode);
    const greetingText = mode === 'voice' 
      ? `Hello ${firstName}! I've analyzed your profile. I'm listening—say "Yes" when you're ready.`
      : `Hello ${firstName}! I've analyzed your profile. Type "Yes" when you're ready to start.`;
    setMessages([{ sender: 'ai', text: greetingText }]);
    setStep('chat');
  };

  // --- SELECTION SCREEN (Post-Analysis) ---
  if (analysisComplete) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center animate-fade-in relative overflow-hidden font-sans">
        
        {/* Header */}
        <div className="relative z-10 mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-black text-black">Ready, {candidateName}!</h2>
          <p className="text-black font-medium text-sm mt-1">Select your interview mode.</p>
        </div>
      
        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md relative z-10">
          <button onClick={() => startSession('text')} className="group p-6 bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl hover:border-indigo-500 hover:shadow-xl transition-all text-left">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-black">Chat Mode</h3>
            <p className="text-xs text-black font-medium">Type answers.</p>
          </button>

          <button onClick={() => startSession('voice')} className="group p-6 bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl hover:border-pink-500 hover:shadow-xl transition-all text-left">
            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600 mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-black">Voice Mode</h3>
            <p className="text-xs text-black font-medium">Speak naturally.</p>
          </button>
        </div>
      </div>
    );
  }

  // --- FORM SCREEN ---
  return (
    <div className="h-full w-full flex flex-col justify-center p-8 font-sans relative backdrop-blur-3xl bg-white/40 rounded-3xl border border-white/20">
      
      {/* Header */}
      <div className="text-center mb-6 flex-shrink-0">
        <h2 className="text-3xl font-black text-black">Setup Interview</h2>
        <p className="text-sm font-bold text-black mt-1 opacity-80">Enter details to generate questions.</p>
      </div>

      <div className="flex flex-col gap-5">
        
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-black uppercase ml-1 block mb-1.5 tracking-wider">First Name</label>
            <input 
              type="text" 
              placeholder="Aditi" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              className="w-full py-3 px-4 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-xl text-sm font-bold text-black placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-black uppercase ml-1 block mb-1.5 tracking-wider">Last Name</label>
            <input 
              type="text" 
              placeholder="Sharma" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              className="w-full py-3 px-4 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-xl text-sm font-bold text-black placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Resume Upload */}
        <div>
          <label className="text-xs font-bold text-black uppercase ml-1 block mb-1.5 tracking-wider">Resume (PDF)</label>
          <div className="relative">
            <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="resume-upload"/>
            <label 
              htmlFor="resume-upload" 
              className={`flex items-center justify-between w-full py-3 px-4 border border-dashed rounded-xl cursor-pointer transition-all shadow-sm ${resumeFile ? "border-green-600 bg-green-50 text-green-800" : "border-gray-400 bg-white/60 hover:bg-white hover:border-black"}`}
            >
              <span className="text-sm font-bold text-black truncate">
                {resumeFile ? `✓ ${resumeFile.name}` : "Click to upload PDF..."}
              </span>
              {!resumeFile && <span className="text-xs font-bold text-black bg-white border border-gray-300 px-3 py-1 rounded-md">Browse</span>}
            </label>
          </div>
        </div>

        {/* JD */}
        <div>
          <label className="text-xs font-bold text-black uppercase ml-1 block mb-1.5 tracking-wider">Job Description</label>
          <textarea 
            className="w-full h-32 p-4 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-xl outline-none resize-none text-sm font-bold text-black placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-black transition-all leading-relaxed shadow-sm" 
            placeholder="Paste the Job Description here..." 
            value={jd} 
            onChange={(e) => setJd(e.target.value)} 
          />
        </div>

        {/* Button */}
        <div className="mt-2">
          <button 
            onClick={handleAnalyze} 
            disabled={loading || !jd || !resumeFile || !firstName || !lastName} 
            className="w-full py-4 bg-black text-white rounded-xl font-black text-base shadow-xl hover:bg-gray-900 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "PROCESSING..." : "START INTERVIEW ➔"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SetupForm;