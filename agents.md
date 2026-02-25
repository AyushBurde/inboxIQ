# AI Guidance and Prompting Rules (agents.md)

This file details the strict constraints, instructions, and rules provided to the AI LLM (Gemini) within the backend systems to ensure predictability, system safety, and correctness.

## 1. The Core System Prompt
The primary interaction with the LLM occurs in `app/services/ai_service.py`. The system prompt acts as a strict programmatic boundary.

```text
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
```

## 2. Guardrails & Rules Enforced in Code
Because LLMs are non-deterministic, the system does not trust the raw output. The following rules are enforced in the Python runtime:

1. **Format Stripping:** The AI often wraps JSON in markdown blockticks (` ```json `). The backend explicitly strips these before parsing to prevent `JSONDecodeError`.
2. **Key Verification:** The system uses `.get("key", "fallback")` for every expected field. If the AI hallucinates and changes the key names, the system defaults to safe schema values rather than throwing a `KeyError`.
3. **Resilience to Failure:** If the AI API is down, rate-limited, or returns unparseable gibberish after 3 retries, the system generates a safe fallback object:
   ```python
   {
       "summary": original_subject,
       "category": "info",
       "priority": "medium",
       "action_required": None,
       "dynamic_metadata": {}
   }
   ```
   This ensures that the application *never crashes* due to an LLM failure.
