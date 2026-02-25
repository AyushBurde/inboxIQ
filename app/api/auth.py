import os
from flask import Blueprint, request, redirect, jsonify
from google_auth_oauthlib.flow import Flow
from typing import Optional

from app.db import get_db
from app.models import GoogleAccount

bp = Blueprint('auth', __name__)

SCOPES = [
    'openid', 
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/gmail.readonly'
]

CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "MISSING_ID")
CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "MISSING_SECRET")
REDIRECT_URI = "http://localhost:8000/api/auth/google/callback"

CLIENT_CONFIG = {
    "web": {
        "client_id": CLIENT_ID,
        "project_id": "unified-inbox",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": CLIENT_SECRET,
        "redirect_uris": [REDIRECT_URI]
    }
}

@bp.route("/google/login", methods=["GET"])
def google_login():
    if CLIENT_ID == "MISSING_ID" or CLIENT_SECRET == "MISSING_SECRET":
        return jsonify({"detail": "Google credentials not configured in .env"}), 500

    flow = Flow.from_client_config(
        CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    
    return redirect(authorization_url)

@bp.route("/google/callback", methods=["GET"])
def google_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"detail": "Authorization code missing"}), 400

    db = next(get_db())
    
    flow = Flow.from_client_config(
        CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    
    try:
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        import requests
        user_info = requests.get(
            "https://www.googleapis.com/oauth2/v1/userinfo", 
            headers={"Authorization": f"Bearer {credentials.token}"}
        ).json()
        
        email = user_info.get("email")
        
        if not email:
            return jsonify({"detail": "Failed to get email address"}), 400
            
        account = db.query(GoogleAccount).filter(GoogleAccount.email == email).first()
        
        if account:
            account.access_token = credentials.token
            account.refresh_token = credentials.refresh_token or account.refresh_token
        else:
            account = GoogleAccount(
                email=email,
                access_token=credentials.token,
                refresh_token=credentials.refresh_token
            )
            db.add(account)
            
        db.commit()
        return redirect(f"http://localhost:5173/?login=success&email={email}")
        
    except Exception as e:
        print(f"Auth error: {e}")
        return jsonify({"detail": str(e)}), 400
