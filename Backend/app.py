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