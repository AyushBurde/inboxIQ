from typing import TypedDict, Optional, Any
from langgraph.graph import StateGraph, END

from app.services.ai_service import analyze_message
from app.models import Message

# -------- STATE --------
class MessageState(TypedDict):
    subject: str
    body: str
    source: str
    sender: str
    db: Any
    ai_result: Optional[dict]
    decision: Optional[str]
    message_id: Optional[int]


# -------- NODE 1: AI Analyze --------
def analyze_node(state: MessageState):
    result = analyze_message(
        subject=state["subject"],
        body=state["body"]
    )
    state["ai_result"] = result
    return state


# -------- NODE 2: Decision --------
def decision_node(state: MessageState):
    priority = state["ai_result"].get("priority", "medium")

    if priority == "high":
        state["decision"] = "notify"
    else:
        state["decision"] = "store_only"

    return state


# -------- NODE 3: High-Priority Alert --------
def alert_node(state: MessageState):
    if state["ai_result"].get("priority") == "high":
        # For now, simple console alert
        print(f"⚡ HIGH PRIORITY EMAIL from {state['sender']}: {state['subject']}")
        # Future: integrate with push notifications / Slack / dashboard flag
    return state


# -------- NODE 4: Store in DB --------
def store_node(state: MessageState):
    db = state["db"]
    ai = state["ai_result"]

    import json
    
    message = Message(
        source=state["source"],
        sender=state["sender"],
        subject=state["subject"],
        body=state["body"],
        summary=ai.get("summary"),
        category=ai.get("category"),
        priority=ai.get("priority"),
        action_required=ai.get("action_required"),
        metadata_json=json.dumps(ai.get("dynamic_metadata", {}))
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    state["message_id"] = message.id
    return state


# -------- BUILD GRAPH --------
def build_graph():
    graph = StateGraph(MessageState)

    graph.add_node("analyze", analyze_node)
    graph.add_node("decide", decision_node)
    graph.add_node("alert_if_high", alert_node)
    graph.add_node("store", store_node)

    graph.set_entry_point("analyze")
    graph.add_edge("analyze", "decide")
    graph.add_edge("decide", "alert_if_high")
    graph.add_edge("alert_if_high", "store")
    graph.add_edge("store", END)

    return graph.compile()


# Singleton instance
message_graph = build_graph()