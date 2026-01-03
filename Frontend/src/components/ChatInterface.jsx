import React, { useState, useRef, useEffect } from 'react';
import { useInterview } from '../context/InterviewContext';

const ChatInterface = () => {
  const { messages, setMessages, questionList, currentIndex, setCurrentIndex, setUserAnswers, setStep } = useInterview();

  // STATES
  const [status, setStatus] = useState('IDLE');
  const [mode, setMode] = useState('text');
  const [input, setInput] = useState('');
  const [currentAiText, setCurrentAiText] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");

  const recognitionRef = useRef(null);
  const endRef = useRef(null);
  const voicesRef = useRef([]);
  const hasGreetedRef = useRef(false);

  // --- 1. INITIAL SETUP ---
  useEffect(() => {
    const selectedMode = sessionStorage.getItem('interviewMode') || 'text';
    setMode(selectedMode);

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesRef.current = voices;
        
        // Initial Greeting
        if (selectedMode === 'voice' && messages.length > 0 && !hasGreetedRef.current) {
           const lastMsg = messages[messages.length - 1];
           if (lastMsg.sender === 'ai') {
             hasGreetedRef.current = true;
             setTimeout(() => speakText(lastMsg.text), 800);
           }
        }
      }
    };

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();

    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);


  // ==========================================
  //      ACTION 1: AI SPEAKS (FEMALE ENGLISH)
  // ==========================================
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;

    setStatus('AI_SPEAKING');
    setCurrentAiText(text);

    window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.abort();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // Higher pitch for female tone

    const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
    
    // Voice Selection (English Female Priority)
    const selectedVoice = voices.find(v => 
      v.name.includes('Google US English') || 
      v.name.includes('Samantha') || 
      v.name.includes('Microsoft Zira') ||
      v.name.includes('Victoria')
    );

    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.onstart = () => setStatus('AI_SPEAKING');
    utterance.onend = () => setStatus('IDLE');
    utterance.onerror = () => setStatus('IDLE');

    window.speechSynthesis.speak(utterance);
  };


  // ==========================================
  //      ACTION 2: MIC LISTENS (ENGLISH)
  // ==========================================
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser not supported. Use Chrome.");
      return;
    }

    if (recognitionRef.current) recognitionRef.current.abort();
    window.speechSynthesis.cancel(); 

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true; 
    recognition.continuous = false;    

    recognition.onstart = () => {
      setStatus('LISTENING');
      setLiveTranscript("");
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setLiveTranscript(transcript);
      if (event.results[0].isFinal) {
        recognition.stop();
        handleUserResponse(transcript);
      }
    };

    recognition.onend = () => {
      setStatus(prev => prev === 'PROCESSING' ? prev : 'IDLE');
    };

    recognitionRef.current = recognition;
    recognition.start();
  };


  // ==========================================
  //      ACTION 3: PROCESS ANSWER
  // ==========================================
  const handleUserResponse = (text) => {
    if (!text.trim()) return;
    setStatus('PROCESSING');
    
    const newHistory = [...messages, { sender: 'user', text }];
    setMessages(newHistory);
    setUserAnswers(prev => [...prev, { question: questionList[currentIndex], answer: text }]);
    setInput('');

    // Logic
    if (messages.length === 1) {
       const ans = text.toLowerCase();
       if (ans.includes('yes') || ans.includes('ready')) {
          setTimeout(() => {
            const nextQ = questionList[0];
            setMessages(prev => [...prev, { sender: 'ai', text: nextQ }]);
            if (mode === 'voice') speakText(nextQ);
          }, 1000);
       } else {
          const bye = "Okay, stopping now.";
          if (mode === 'voice') speakText(bye);
          setTimeout(() => setStep('setup'), 2000);
       }
       return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < questionList.length) {
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        const nextQ = questionList[nextIndex];
        setMessages(prev => [...prev, { sender: 'ai', text: nextQ }]);
        if (mode === 'voice') speakText(nextQ);
      }, 1500);
    } else {
      setTimeout(() => setStep('result'), 1000);
    }
  };

  const manualSend = () => {
    if(!input.trim()) return;
    handleUserResponse(input);
  }

  // ==========================================
  //      RENDER: VOICE MODE
  // ==========================================
  if (mode === 'voice') {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-900 relative overflow-hidden font-sans">
        
        {/* ANIMATED BOT */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 
            ${status === 'AI_SPEAKING' ? 'scale-110 shadow-[0_0_80px_rgba(236,72,153,0.5)]' : 'scale-100'} 
            ${status === 'LISTENING' ? 'scale-105 shadow-[0_0_80px_rgba(34,197,94,0.4)]' : ''}
          `}>
             <div className="w-40 h-40 bg-black rounded-full border-4 border-gray-800 flex items-center justify-center relative z-20 overflow-hidden">
                <div className="flex gap-6 transition-all duration-300">
                   {/* Eyes */}
                   <div className={`bg-pink-500 rounded-full transition-all duration-300 
                     ${status === 'AI_SPEAKING' ? 'w-8 h-2 animate-[bounce_0.5s_infinite]' : 'w-8 h-12'}
                     ${status === 'LISTENING' ? 'w-8 h-8 rounded-full bg-green-500' : ''}
                   `}></div>
                   <div className={`bg-pink-500 rounded-full transition-all duration-300 
                     ${status === 'AI_SPEAKING' ? 'w-8 h-2 animate-[bounce_0.5s_infinite]' : 'w-8 h-12'}
                     ${status === 'LISTENING' ? 'w-8 h-8 rounded-full bg-green-500' : ''}
                   `}></div>
                </div>
             </div>
          </div>

          {/* STATUS TEXT */}
          <div className="mt-8 text-center h-32 max-w-lg px-4 flex items-center justify-center flex-col">
             {status === 'AI_SPEAKING' && <p className="text-xl font-medium text-pink-300 animate-pulse">"{currentAiText}"</p>}
             {status === 'LISTENING' && <p className="text-xl text-white font-medium">{liveTranscript || "Listening..."}</p>}
             {status === 'PROCESSING' && <p className="text-gray-400 animate-pulse">Thinking...</p>}
             {status === 'IDLE' && <p className="text-gray-500">Tap to reply</p>}
          </div>

          {/* MIC BUTTON */}
          <div className="mt-2 h-24">
            {(status === 'IDLE' || status === 'LISTENING') && (
               <button 
                 onClick={startListening}
                 disabled={status === 'LISTENING'}
                 className={`group relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
                   status === 'LISTENING' 
                     ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50 animate-pulse' 
                     : 'bg-white hover:scale-105 shadow-xl shadow-white/10'
                 }`}
               >
                 {status === 'LISTENING' ? <div className="w-8 h-8 bg-white rounded-md"></div> : <svg className="w-8 h-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
               </button>
            )}
          </div>
        </div>

        <button onClick={() => setStep('setup')} className="absolute bottom-6 text-gray-600 hover:text-white text-sm">Exit Interview</button>
      </div>
    );
  }

  // Text Mode (Unchanged)
  return (
    <div className="flex flex-col h-full bg-gray-50 relative font-sans">
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <h3 className="font-bold text-gray-800">Chat Interview</h3>
        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">{currentIndex + 1} / {questionList.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-black text-white' : 'bg-white border text-gray-800'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="bg-white p-4 border-t flex gap-2">
        <input className="flex-1 bg-gray-100 px-4 py-3 rounded-xl outline-none" placeholder="Type answer..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && manualSend()}/>
        <button onClick={manualSend} className="bg-black text-white px-6 rounded-xl">Send</button>
      </div>
    </div>
  );
};

export default ChatInterface;