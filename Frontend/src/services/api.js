// src/services/api.js

// Ensure this matches your Flask backend URL
const API_BASE_URL = "http://127.0.0.1:5000"; 

export const apiService = {

  // --- STEP 1: Upload Resume & Get Questions ---
  // Input: resumeFile (File Object from <input type="file">), jdText (String)
  // Output: { "questions": ["Question 1", "Question 2", ...] }
  generateQuestions: async (resumeFile, jdText) => {
    try {
      // 1. Create FormData to handle file uploads
      const formData = new FormData();
      formData.append('file', resumeFile); 
      formData.append('job_description', jdText); 

      // 2. Send Request to Backend
      const response = await fetch(`${API_BASE_URL}/upload-resume`, {
        method: 'POST',
        // Note: Content-Type is set automatically by fetch when using FormData
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); 
        throw new Error(errorData.error || 'Failed to generate questions');
      }
      
      return await response.json(); 
    } catch (error) {
      console.error("API Error (Upload):", error);
      throw error;
    }
  },

  // --- STEP 2: Analyze Single Answer ---
  // Input: questionText (String), userAnswer (String)
  // Output: { "score": 8, "feedback": "...", "keywords_missed": [...] }
  analyzeAnswer: async (questionText, userAnswer) => {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          question: questionText,
          user_answer: userAnswer 
        }),
      });

      if (response.status === 429) {
        throw new Error("QUOTA_EXCEEDED");
      }

      if (!response.ok) {
        throw new Error('Failed to analyze answer');
      }

      return await response.json();
    } catch (error) {
      console.error("API Error (Analyze):", error);
      throw error;
    }
  }
};