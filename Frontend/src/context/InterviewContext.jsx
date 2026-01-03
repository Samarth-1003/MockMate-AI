import React, { createContext, useState, useContext } from 'react';

const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
  const [step, setStep] = useState('setup'); 
  const [questionList, setQuestionList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  
  // --- NEW: Store Candidate Name ---
  const [candidateName, setCandidateName] = useState(""); 

  return (
    <InterviewContext.Provider value={{
      step, setStep,
      questionList, setQuestionList,
      currentIndex, setCurrentIndex,
      messages, setMessages,
      userAnswers, setUserAnswers,
      candidateName, setCandidateName // Export these
    }}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => useContext(InterviewContext);