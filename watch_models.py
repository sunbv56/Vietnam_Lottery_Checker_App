import google.generativeai as genai
import os

# Set API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("📦 Các model có thể dùng với GenerativeModel:\n")

for m in genai.list_models():
    # Chỉ lấy model hỗ trợ generateContent (dùng được cho GenerativeModel)
    if "generateContent" in m.supported_generation_methods:
        print(f"- {m.name}")
