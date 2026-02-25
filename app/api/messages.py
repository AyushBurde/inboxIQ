from flask import Blueprint, request, jsonify

from app.db import get_db
from app.schemas import MessageCreate
from app.agents.message_graph import message_graph
from app.models import Message, GoogleAccount
from app.services.gmail_service import fetch_unread_emails, mark_email_as_read

bp = Blueprint('messages', __name__)

@bp.route("/messages/sync", methods=["POST"])
def sync_gmail_messages():
    email = request.args.get("email")
    if not email:
        return jsonify({"detail": "Missing email"}), 400

    db = next(get_db())
    account = db.query(GoogleAccount).filter(GoogleAccount.email == email).first()
    if not account:
        return jsonify({"detail": "User not found or not authenticated"}), 404
        
    if not account.access_token:
        return jsonify({"detail": "Missing Google access token. Please login again."}), 400

    raw_emails = fetch_unread_emails(
        access_token=account.access_token,
        refresh_token=account.refresh_token,
        max_results=5
    )
    
    processed_messages = []
    
    for email_data in raw_emails:
        state = message_graph.invoke({
            "subject": email_data["subject"],
            "body": email_data["body"],
            "source": email_data["source"],
            "sender": email_data["sender"],
            "db": db,
            "ai_result": None,
            "decision": None,
            "message_id": None
        })
        
        mark_email_as_read(
            access_token=account.access_token, 
            refresh_token=account.refresh_token, 
            message_id=email_data["id"]
        )
        
        processed_messages.append({
            "id": state["message_id"],
            "subject": email_data["subject"],
            "decision": state["decision"],
            "priority": state["ai_result"].get("priority") if state.get("ai_result") else "unknown"
        })
        
    return jsonify({
        "status": "success", 
        "messages_processed": len(processed_messages),
        "results": processed_messages
    })

@bp.route("/messages", methods=["POST"])
def create_message():
    data = request.json
    db = next(get_db())
    
    state = message_graph.invoke({
        "subject": data.get("subject"),
        "body": data.get("body"),
        "source": data.get("source"),
        "sender": data.get("sender"),
        "db": db,
        "ai_result": None,
        "decision": None,
        "message_id": None
    })

    return jsonify({
        "id": state["message_id"],
        "decision": state["decision"],
        "ai_result": state["ai_result"]
    })

@bp.route("/messages", methods=["GET"])
def get_all_messages():
    db = next(get_db())
    messages = db.query(Message).order_by(Message.id.desc()).all()
    # Serialize the objects for json
    results = []
    for m in messages:
        results.append({
            "id": m.id,
            "source": m.source,
            "sender": m.sender,
            "subject": m.subject,
            "body": m.body,
            "summary": m.summary,
            "category": m.category,
            "priority": m.priority,
            "action_required": m.action_required,
            "metadata_json": m.metadata_json
        })
    return jsonify(results)