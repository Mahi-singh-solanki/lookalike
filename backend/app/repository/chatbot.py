import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from fastapi import HTTPException
import json


load_dotenv()

llm = ChatGroq(
    model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
    api_key=os.getenv("GROQ_API_KEY") or os.getenv("GROK_API_KEY"),
)

template = """
You are an expert form generator.

Your task is to generate a JSON form schema based on the user's request.

STRICT RULES (DO NOT BREAK):
1. Output ONLY valid JSON (no explanation, no markdown, no extra text)
2. Follow this exact structure:
{{
  "title": "Form Title",
  "fields": [
    {{
      "id": "unique_id",
      "type": "field_type",
      "label": "Question label",
      "required": true,
      "options": ["option1", "option2"],
      "placeholder": "optional text"
    }}
  ]
}}


3. Allowed field types ONLY:
text, textarea, number, select, multiselect, radio, checkbox, date,
file, email, phone, rating, slider

Preferred node patterns:
- text: name, username, city
- textarea: address, bio, comments
- number: age, quantity, price
- select: country, gender, category
- radio: yes/no, subscription type
- multiselect: skills, interests, tags
- checkbox: agree terms, preferences
- date: birthdate, appointment
- email: email address
- phone: phone number
- rating: product rating, feedback score
- slider: volume, budget range
- file: resume, image, document

4. Rules:
- "id" must be short, unique, lowercase (like q1, q2, name, email)
- Use "options" ONLY for select, radio, multiselect
- Do NOT include options for other types
- Keep form clean and logical
- Use proper labels based on user intent

5. If user request is unclear, make a reasonable structured form

USER REQUEST:
{question}

OUTPUT (JSON ONLY):
"""


prompt=ChatPromptTemplate.from_template(template)

chain=prompt | llm
def chat_bot(question):
    try:
        result=chain.invoke({"question":question})
        return json.loads(result.content)
    except Exception as e:
        raise HTTPException(status_code=400,detail=e)
    
