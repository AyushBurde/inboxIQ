# Walkthrough Video Script / Guide (10-15 min)

## 1. Introduction & Architecture (3 mins)
- **Goal:** Showcase the Unified Inbox—an AI agent that sorts emails.
- **Architecture:** 
  - **Frontend:** React + Vite (Simple, component-based UI).
  - **Backend:** Python + Flask (API framework).
  - **Database:** MySQL + SQLAlchemy ORM (Relational strictness).
  - **AI Layer:** Google Gemini 2.0 via LangGraph.
- **Flow:** User clicks "Sync" -> Backend fetches Gmail -> LangGraph routes each email to Gemini -> Extracts JSON -> Stored in MySQL -> React displays it.

## 2. Structure & Simplicity (3 mins)
- Show the directory structure (API, Agents, Models, Services). Explain *why* it's split up: clear boundaries.
- Show `app/models.py`. Explain the choice of relational database (MySQL) to enforce data limits (`VARCHAR(255)`), preventing the AI from overloading the database with hallucinations.
- Show `App.jsx`. Highlight the simplicity—no over-engineered state management, just clean, readable hooks.

## 3. Interface Safety & Correctness (3 mins)
- Show `app/schemas.py`. Explain how Pydantic acts as a guard. It ensures the API contract between Python and React cannot be broken, even if the AI behaves unexpectedly.
- Explain the `metadata_json` field. This is the **Change Resilience** feature. If we want the AI to track "Meeting Links" tomorrow, we just update the prompt. We *don't* need to run a database migration, so new features don't break old systems.

## 4. AI Usage, Risks & The "Zapier Argument" (4 mins)
- Open `ai_service.py` and show the `SYSTEM_PROMPT`. 
- **Guidance:** Explain how the prompt strictly constrains the AI to output exactly a JSON structure and explicit priority strings ("high", "medium", "low").
- **Verification:** Walk through the `json.loads()` and `.get()` fallbacks in `ai_service.py`. We never trust the AI blindly. We parse and validate.
- **Risks Explained:** Discuss the API rate-limit risk. Show the `try/except` block with the 3-retry loop in `ai_service.py`. This provides **Observability** (it prints to the console) and **Correctness** (it falls back to a safe default if it fails).
- **The "Zapier Argument" (Crucial):** Address the elephant in the room. Why not use Zapier -> Slack? 
  - *Data Ownership:* Zapier is linear and transient. A custom DB means we own the relational state. We can query historical priorities or train new models.
  - *Security Boundaries:* We control the exact OAuth flow and restrict our own scopes (`gmail.readonly`). We don't blindly hand over inbox keys to a third-party automation tool.
  - *Agentic Extensibility:* A custom LangGraph implementation means we can easily add new "nodes" (e.g., an automatic Calendar push, or a drafted-reply generator) natively, without paying for premium Zapier tasks.

## 5. Demonstration (2 mins)
- Demonstrate logging in via Google OAuth.
- Click "Sync" and show the terminal logs capturing the AI thought process.
- Show the React UI populating with the emails and the dynamic metadata grid.
