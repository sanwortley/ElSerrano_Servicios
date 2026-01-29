import google.generativeai as genai
import os

key = None
if os.path.exists(".env"):
    with open(".env", "r") as f:
        for line in f:
            if line.startswith("GEMINI_API_KEY="):
                key = line.split("=")[1].strip()

if not key:
    print("No key")
    exit()

genai.configure(api_key=key)

test_models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.0-pro',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash'
]

for m_name in test_models:
    try:
        print(f"Testing {m_name}...")
        model = genai.GenerativeModel(m_name)
        response = model.generate_content("Hi")
        print(f"✅ {m_name} works! Response: {response.text.strip()}")
        break
    except Exception as e:
        print(f"❌ {m_name} failed: {e}")
