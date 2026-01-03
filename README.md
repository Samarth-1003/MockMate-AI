================================================
FILE: Backend/app.py
================================================
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sys # Added for flushing stdout
from utils import configure_genai, extract_text_from_pdf, generate_questions_with_gemini, analyze_answer_with_gemini

# Load environment variables
load_dotenv()

# Initialize
try:
    configure_genai()
    print("DEBUG: Gemini AI Configured Successfully", file=sys.stdout)
except Exception as e:
    print(f"Startup Error: {e}", file=sys.stdout)

app = Flask(__name__)
CORS(app) 

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "Backend is running correctly"})

@app.route('/upload-resume', methods=['POST'])
def upload_resume():
    print("DEBUG: /upload-resume called", file=sys.stdout)
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    job_description = request.form.get('job_description', '')
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        try:
            resume_text = extract_text_from_pdf(file)
            print(f"DEBUG: Resume text extracted (len: {len(resume_text)})", file=sys.stdout)
            
            questions_list = generate_questions_with_gemini(resume_text, job_description)
            print(f"DEBUG: Questions generated: {questions_list}", file=sys.stdout)
            
            return jsonify({"questions": questions_list})
        except Exception as e:
            print(f"ERROR in upload-resume: {e}", file=sys.stdout)
            return jsonify({"error": str(e)}), 500

@app.route('/analyze-answer', methods=['POST'])
def analyze_answer():
    print("DEBUG: /analyze-answer called", file=sys.stdout)
    data = request.json
    print(f"DEBUG: Received payload: {data}", file=sys.stdout)
    
    if not data or 'question' not in data or 'user_answer' not in data:
        print("ERROR: Missing question or user_answer", file=sys.stdout)
        return jsonify({"error": "Missing question or user_answer"}), 400
    
    question = data['question']
    user_answer = data['user_answer']
    
    # Function returns a dict: { "score": 8, "feedback": "...", "keywords_missed": [] }
    analysis = analyze_answer_with_gemini(question, user_answer)
    print(f"DEBUG: Analysis result: {analysis}", file=sys.stdout)
    
    return jsonify(analysis)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)


================================================
FILE: Backend/requirements.txt
================================================
flask
flask-cors
python-dotenv
google-generativeai
pypdf2


================================================
FILE: Backend/utils.py
================================================
import google.generativeai as genai
import os
import json
from PyPDF2 import PdfReader

def configure_genai():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("No API key found. Please check your .env file.")
    genai.configure(api_key=api_key)

def extract_text_from_pdf(pdf_file):
    try:
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def generate_questions_with_gemini(resume_text, job_desc):
    # Fix: Disable safety filters that might block content
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    ]
    
    model = genai.GenerativeModel(
        'gemini-2.5-flash-lite',
        generation_config={"response_mime_type": "application/json"},
        safety_settings=safety_settings
    )
    
    prompt = f"""
    You are a technical interviewer. 
    Resume Context: {resume_text}
    Job Description: {job_desc}
    
    Task: Generate 5 specific technical interview questions based on the candidate's resume and job description.
    
    Output Schema:
    Return a list of strings.
    Example: ["Question 1", "Question 2", "Question 3"]
    """
    
    try:
        response = model.generate_content(prompt)
        questions = json.loads(response.text)
        return questions
    except Exception as e:
        print(f"Error generating questions: {e}")
        return ["Could not generate questions. Please try again."]

def analyze_answer_with_gemini(question, user_answer):
    # Fix: Disable safety filters
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    ]

    model = genai.GenerativeModel(
        'gemini-2.5-flash-lite',
        generation_config={"response_mime_type": "application/json"},
        safety_settings=safety_settings
    )
    
    # We strictly enforce the keys in the prompt
    prompt = f"""
    You are an interviewer evaluating a candidate.
    Question: {question}
    Candidate's Answer: {user_answer}
    
    Task: Rate the confidence/quality (1-10) and identify missing technical keywords.
    
    IMPORTANT: You MUST return a JSON object with EXACTLY these keys: "score", "feedback", "keywords_missed".
    
    Output Schema (JSON):
    {{
        "feedback": "A constructive 1-2 sentence feedback string.",
        "score": 5,
        "keywords_missed": ["keyword1", "keyword2"]
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        analysis = json.loads(response.text)
        
        # Validation: Ensure keys exist, otherwise add defaults
        if "score" not in analysis: 
            analysis["score"] = 0
        if "feedback" not in analysis: 
            analysis["feedback"] = "Could not analyze answer."
        if "keywords_missed" not in analysis: 
            analysis["keywords_missed"] = []
            
        # Ensure score is an integer
        if isinstance(analysis["score"], str):
             try:
                 analysis["score"] = int(analysis["score"])
             except:
                 analysis["score"] = 0
        
        return analysis
    except Exception as e:
        print(f"Error analyzing answer: {e}")
        return {
            "feedback": "Error analyzing response. Please try again.",
            "score": 0,
            "keywords_missed": []
        }


================================================
FILE: Frontend/README.md
================================================
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



================================================
FILE: Frontend/eslint.config.js
================================================
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])



================================================
FILE: Frontend/index.html
================================================
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MockMate AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>



================================================
FILE: Frontend/package.json
================================================
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.23",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.1",
    "vite": "^7.2.4"
  }
}



================================================
FILE: Frontend/postcss.config.js
================================================
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}



================================================
FILE: Frontend/tailwind.config.js
================================================
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
// tailwind.config.js



================================================
FILE: Frontend/vite.config.js
================================================
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
  ],
})



================================================
FILE: Frontend/src/App.css
================================================
/* src/App.css */

/* --- General Layout --- */
body {
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
  background-color: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.app-layout {
  width: 100%;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 60vh; /* Fixed height for chat scrolling */
}

nav {
  background-color: #007bff;
  color: white;
  padding: 15px;
  text-align: center;
  font-weight: bold;
  font-size: 1.2rem;
}

main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* --- Setup Form --- */
.setup-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.setup-container textarea {
  height: 150px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  resize: none;
}

.setup-container input[type="file"] {
  border: 2px dashed #ccc;
  padding: 20px;
  text-align: center;
  border-radius: 6px;
  cursor: pointer;
}

/* --- Chat Interface --- */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 20px;
}

.message {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 10px;
  line-height: 1.4;
  font-size: 0.95rem;
}

.message.ai {
  background-color: #e9ecef;
  color: #333;
  align-self: flex-start;
  border-bottom-left-radius: 0;
}

.message.user {
  background-color: #007bff;
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 0;
}

.input-area {
  display: flex;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.input-area input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
}

/* --- Buttons --- */
button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

button:hover {
  background-color: #0056b3;
}

.end-btn {
  margin-top: 10px;
  background-color: #dc3545;
  width: 100%;
}
.end-btn:hover { background-color: #a71d2a; }

/* --- Result Card --- */
.result-container {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.score-display {
  font-size: 2.5rem;
  font-weight: bold;
  color: #007bff;
  margin: 20px 0;
}


================================================
FILE: Frontend/src/App.jsx
================================================
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


================================================
FILE: Frontend/src/index.css
================================================
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
  background-color: #0f172a;
  font-family: 'Inter', sans-serif;
  overflow: hidden; /* App.jsx handles scrolling via the main container */
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: #334155;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #475569;
}

::-webkit-scrollbar-track {
  background-color: transparent;
}

/* =========================================
   CUSTOM ANIMATIONS
   ========================================= */

/* 1. Loading Screen Animations */
@keyframes reverse-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-reverse-spin {
  animation: reverse-spin 2s linear infinite;
}

.animate-spin-slow {
  animation: spin-slow 4s linear infinite;
}

/* 2. Fade In Animation (Used in SetupForm, ContactUs) */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

/* 3. Background Blob Animation (Used in SetupForm & Hero Background) */
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

.animate-blob {
  animation: blob 7s infinite;
}

/* Delays for multiple blobs so they don't move in sync */
.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

/* 4. Slow Pulse (Used in Hero Background) */
.animate-pulse-slow {
  animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}


================================================
FILE: Frontend/src/main.jsx
================================================
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <App />
)



================================================
FILE: Frontend/src/components/AboutUs.jsx
================================================
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


================================================
FILE: Frontend/src/components/ChatInterface.jsx
================================================
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


================================================
FILE: Frontend/src/components/ContactUs.jsx
================================================
import React from 'react';

const SocialLink = ({ href, icon, colorClass }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 transition-all duration-300 hover:text-white hover:scale-110 ${colorClass}`}
  >
    {icon}
  </a>
);

const TeamCard = ({ name, role, image, socials, delay }) => (
  <div className={`relative group p-1 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 hover:from-indigo-500/50 hover:to-purple-500/50 transition-all duration-500 hover:-translate-y-2 animate-fade-in ${delay}`}>
    
    {/* Inner Card Content */}
    <div className="bg-[#1e293b] rounded-[22px] p-8 flex flex-col items-center text-center h-full relative z-10 overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

      {/* Profile Image */}
      <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 mb-6 relative group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-shadow duration-500">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full rounded-full object-cover border-4 border-[#1e293b] bg-gray-800"
          // Fallback if image not found
          onError={(e) => {e.target.src = "https://ui-avatars.com/api/?name=" + name + "&background=random"}}
        />
        <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-[#1e293b] rounded-full"></div>
      </div>

      {/* Text Info */}
      <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-300 group-hover:to-purple-300 transition-all">
        {name}
      </h3>
      <p className="text-indigo-400 font-medium text-sm mb-6 uppercase tracking-wider">
        {role}
      </p>

      {/* Social Icons */}
      <div className="flex gap-4 mt-auto">
        <SocialLink 
          href={socials.linkedin} 
          colorClass="hover:bg-[#0077b5]" 
          icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>}
        />
        <SocialLink 
          href={socials.instagram} 
          colorClass="hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-500" 
          icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>}
        />
        <SocialLink 
          href={`mailto:${socials.email}`}
          colorClass="hover:bg-red-500" 
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        />
      </div>
    </div>
  </div>
);

const ContactUs = () => {
  return (
    // Changed bg color to match main site: #0f172a
    <section id="contact" className="relative w-full py-24 px-6 md:px-12 bg-[#0f172a] border-t border-white/5">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
        <span className="text-purple-400 font-bold tracking-widest text-xs uppercase bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
          The Team
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-white mt-6 mb-4">
          Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Creators</span>
        </h2>
        <p className="text-gray-400">
          Passionate developers building the future of AI interviews.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10">
        
        {/* CARD 1: SAMARTH */}
        <TeamCard 
          name="Samarth Bhavsar"
          role="Backend Developer"
          image="/samarth.JPG" 
          delay="animation-delay-0"
          socials={{
            linkedin: "https://www.linkedin.com/in/samarth-bhavsar-33a50b355",
            instagram: "#",
            email: "samarthbhavsar1003@gmail.com"
          }}
        />

        {/* CARD 2: KUSH */}
        <TeamCard 
          name="Kush Bhatt"
          role="Frontend Developer"
          image="/kush.JPG" 
          delay="animation-delay-200"
          socials={{
            linkedin: "https://www.linkedin.com/in/kushbhatt1902",
            instagram: "#",
            email: "bhattkush2170@gmail.com"
          }}
        />

      </div>

      {/* Background Decor */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

    </section>
  );
};

export default ContactUs;


================================================
FILE: Frontend/src/components/Footer.jsx
================================================
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


================================================
FILE: Frontend/src/components/Header.jsx
================================================
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


================================================
FILE: Frontend/src/components/LoadingScreen.jsx
================================================
import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    "Initializing Neural Networks...",
    "Calibrating Voice Engine...",
    "Loading Context Modules...",
    "Securing Connection...",
    "Preparing Interview Environment..."
  ];

  useEffect(() => {
    // 1. Progress Bar Timer
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Small delay before unmounting
          return 100;
        }
        // Randomize speed for realism
        const increment = Math.random() * 2 + 0.5; 
        return Math.min(prev + increment, 100);
      });
    }, 30);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    // 2. Message Cycler
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 800);

    return () => clearInterval(messageTimer);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center z-50 overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent animate-pulse-slow pointer-events-none"></div>

      {/* --- THE CORE ANIMATION --- */}
      <div className="relative w-32 h-32 mb-12">
        
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
        
        {/* Middle Ring (Reverse) */}
        <div className="absolute inset-3 rounded-full border-b-2 border-l-2 border-purple-500 animate-[spin_2s_linear_infinite_reverse]"></div>
        
        {/* Inner Core */}
        <div className="absolute inset-8 rounded-full bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] animate-pulse">
           <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
        </div>

        {/* Orbiting Particle */}
        <div className="absolute inset-0 animate-spin-slow">
           <div className="w-2 h-2 bg-cyan-400 rounded-full absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 shadow-[0_0_15px_cyan]"></div>
        </div>
      </div>

      {/* --- TEXT & PROGRESS --- */}
      <div className="w-64 flex flex-col items-center gap-4 relative z-10">
        
        {/* Main Title */}
        <h1 className="text-3xl font-black text-white tracking-wider">
          AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">INTERVIEWER</span>
        </h1>

        {/* Dynamic Status Text */}
        <div className="h-6">
          <p className="text-xs font-mono text-cyan-400/80 animate-fade-in uppercase tracking-widest">
            {messages[messageIndex]}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mt-4 relative">
          {/* Moving Bar */}
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transition-all duration-100 ease-out relative"
            style={{ width: `${progress}%` }}
          >
             {/* Glow at the tip of the bar */}
             <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white/50 to-transparent"></div>
          </div>
        </div>

        {/* Percentage */}
        <p className="text-gray-500 text-xs font-mono">{Math.floor(progress)}%</p>
      </div>
    </div>
  );
};

export default LoadingScreen;


================================================
FILE: Frontend/src/components/ResultCard.jsx
================================================
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


================================================
FILE: Frontend/src/components/SetupForm.jsx
================================================
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


================================================
FILE: Frontend/src/context/InterviewContext.jsx
================================================
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


================================================
FILE: Frontend/src/services/api.js
================================================
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

