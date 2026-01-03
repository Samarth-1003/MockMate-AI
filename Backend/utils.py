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