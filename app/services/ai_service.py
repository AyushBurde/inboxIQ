import time
import json
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = "gemini-2.0-flash"

SYSTEM_PROMPT = """
You analyze professional messages.

CRITICAL PRIORITY RULES:
- If the email is about an INTERVIEW, JOB OFFER, RECRUITING, or from top tech companies (e.g., Microsoft, Google, Amazon, Meta), you MUST set "priority" to "high".
- "high" priority requires immediate attention.
- "medium" is for standard tasks or correspondence.
- "low" is for newsletters, promotions, or generic info.

CRITICAL SUMMARIZATION RULES (DO NOT COPY THE EMAIL):
- You MUST write a completely original summary.
- NEVER copy and paste chunks of the original email.
- The summary MUST be readable in under 10 seconds (Maximum 15 words).
- The action_required MUST be extremely short and punchy (Maximum 7 words).

Return JSON EXACTLY in this format:
{
  "summary": "Extremely short, original summary of the core point.",
  "category": "job | networking | meeting | opportunity | promotion | info | ignore",
  "priority": "high | medium | low",
  "action_required": "Short next step",
  "dynamic_metadata": {
    "key": "value"
  }
}

INSTRUCTIONS FOR dynamic_metadata:
- Extract any meaningful structured data from the email into this object.
- For example, if it's an assessment: {"Stack": "...", "Deadline": "...", "Submission": "..."}
- If it's an interview: {"Date": "...", "Time": "...", "Topics": "...", "Interviewer": "..."}
- Keep keys concise and Capitalized. If no metadata makes sense, leave it empty: {}
"""

def analyze_message(subject: str, body: str) -> dict:
    prompt = f"{SYSTEM_PROMPT}\nSubject: {subject}\nBody: {body}"

    for attempt in range(3):  # retry 3 times
        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=prompt
            )

            content = response.text.strip()
            content = content.replace("```json", "").replace("```", "").strip()
            result = json.loads(content)

            return {
                "summary": result.get("summary", subject),
                "category": result.get("category", "info"),
                "priority": result.get("priority", "medium"),
                "action_required": result.get("action_required"),
                "dynamic_metadata": result.get("dynamic_metadata", {})
            }

        except Exception as e:
            print(f"AI Error (attempt {attempt+1}):", e)

            # If rate limited → wait and retry
            if "quota" in str(e).lower() or "429" in str(e):
                time.sleep(30)
                continue
            else:
                break

    # Fallback (never crash)
    return {
        "summary": subject,
        "category": "info",
        "priority": "medium",
        "action_required": None
    }