import React, { useEffect, useState } from 'react';
import { useInterview } from '../context/InterviewContext';
import { apiService } from '../services/api';

const ResultCard = () => {
  const { userAnswers, setStep, setMessages, setUserAnswers, setQuestionList } = useInterview();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [percentage, setPercentage] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const calculate = async () => {
      setLoading(true); setError(null);
      let total = 0;
      try {
        for (const item of userAnswers) {
          await new Promise(r => setTimeout(r, 800)); // Animation buffer
          const res = await apiService.analyzeAnswer(item.question, item.answer);
          
          // Robust Score Check
          let score = 0;
          if(res) {
             if(res.score !== undefined) score = res.score;
             else if(res.Score !== undefined) score = res.Score;
             else if(res.evaluation?.score) score = res.evaluation.score;
          }
          if(typeof score === 'string') score = parseFloat(score);
          if(isNaN(score)) score = 0;
          total += score;
        }

        const pct = Math.round((total / (userAnswers.length * 10)) * 100) || 0;
        setPercentage(pct);
        
        // Feedback Logic
        if(pct >= 80) setFeedback("Exceptional work! You demonstrated profound knowledge and clarity.");
        else if(pct >= 50) setFeedback("Solid effort. You have a good base, but some details were missed.");
        else setFeedback("Needs Improvement. We recommend reviewing the core requirements.");
        
        setLoading(false);
      } catch (err) {
        if(err.message === "QUOTA_EXCEEDED") setError("AI Limit Reached. Wait 1 min.");
        else setError("Calculation failed.");
        setLoading(false);
      }
    };
    calculate();
  }, [userAnswers]);

  const restart = () => { setMessages([]); setUserAnswers([]); setQuestionList([]); setStep('setup'); };

  if(loading) return (
    <div className="h-full flex flex-col items-center justify-center bg-white space-y-6">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-gray-500 font-medium animate-pulse">Analyzing Performance...</p>
    </div>
  );

  if(error) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
      <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 text-2xl">⚠️</div>
      <p className="text-gray-800 font-bold mb-4">{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gray-800 text-white rounded-lg">Retry</button>
    </div>
  );

  return (
    <div className="h-full flex flex-col items-center justify-center bg-white p-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      
      <div className="relative z-10 text-center max-w-md w-full">
        
        <div className="mb-8 relative inline-block">
           <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
           <div className="relative w-48 h-48 rounded-full border-8 border-gray-50 bg-white flex flex-col items-center justify-center shadow-2xl">
             <span className="text-6xl font-black text-gray-900 tracking-tighter">{percentage}%</span>
             <span className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-widest">Score</span>
           </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Complete</h2>
        
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 shadow-sm">
          <p className="text-gray-600 font-medium leading-relaxed">{feedback}</p>
        </div>

        <button 
          onClick={restart}
          className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-lg shadow-gray-900/20 transition-all transform hover:-translate-y-1"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
};

export default ResultCard;