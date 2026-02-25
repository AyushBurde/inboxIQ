import os
import base64
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from bs4 import BeautifulSoup
from typing import List, Dict

# Rebuild credentials using the data we saved in the DB
def get_google_credentials(access_token: str, refresh_token: str) -> Credentials:
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    
    return Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret
    )

def extract_plain_text(parts: list) -> str:
    """Recursively extract plain text from Gmail payload parts"""
    text = ""
    for part in parts:
        mime_type = part.get("mimeType")
        body = part.get("body", {})
        data = body.get("data")
        
        if mime_type == "text/plain" and data:
            decoded_bytes = base64.urlsafe_b64decode(data)
            text += decoded_bytes.decode("utf-8", errors="ignore")
        elif mime_type == "text/html" and data and not text: 
            # Fallback to HTML if no plain text, and strip tags
            decoded_bytes = base64.urlsafe_b64decode(data)
            html_content = decoded_bytes.decode("utf-8", errors="ignore")
            soup = BeautifulSoup(html_content, "html.parser")
            text += soup.get_text(separator="\n").strip()
        elif "parts" in part:
            # It's a multipart message, recurse into it
            text += extract_plain_text(part["parts"])
            
    return text.strip()

def fetch_unread_emails(access_token: str, refresh_token: str, max_results: int = 10) -> List[Dict]:
    """Fetches Unread emails and extracts the relevant fields"""
    
    creds = get_google_credentials(access_token, refresh_token)
    
    try:
        service = build('gmail', 'v1', credentials=creds)
        
        # Search for unread emails in the inbox
        results = service.users().messages().list(
            userId='me', 
            labelIds=['INBOX', 'UNREAD'], 
            maxResults=max_results
        ).execute()
        
        messages = results.get('messages', [])
        
        if not messages:
            return []
            
        parsed_emails = []
        
        for msg in messages:
            # Fetch the full email payload
            msg_data = service.users().messages().get(
                userId='me', 
                id=msg['id'],
                format='full'
            ).execute()
            
            payload = msg_data.get("payload", {})
            headers = payload.get("headers", [])
            
            # Extract headers
            subject = "No Subject"
            sender = "Unknown Sender"
            
            for header in headers:
                if header["name"].lower() == "subject":
                    subject = header["value"]
                elif header["name"].lower() == "from":
                    sender = header["value"]
                    
            # Extract Body
            body = ""
            if "parts" in payload:
                body = extract_plain_text(payload["parts"])
            else:
                # Sometimes the body isn't in parts, it's just in the payload body directly
                data = payload.get("body", {}).get("data")
                if data:
                    decoded = base64.urlsafe_b64decode(data)
                    body = decoded.decode("utf-8", errors="ignore")
                    if payload.get("mimeType") == "text/html":
                        soup = BeautifulSoup(body, "html.parser")
                        body = soup.get_text(separator="\n").strip()
            
            # Limit body size to prevent massive prompts to the AI
            body = body[:5000] if body else "Empty message"
            
            parsed_emails.append({
                "id": msg['id'],
                "subject": subject,
                "sender": sender,
                "body": body,
                "source": "gmail"
            })
            
        return parsed_emails
        
    except Exception as e:
        print(f"Error fetching Gmail: {e}")
        return []

def mark_email_as_read(access_token: str, refresh_token: str, message_id: str):
    """Removes the UNREAD label from an email"""
    creds = get_google_credentials(access_token, refresh_token)
    try:
        service = build('gmail', 'v1', credentials=creds)
        service.users().messages().modify(
            userId='me',
            id=message_id,
            body={'removeLabelIds': ['UNREAD']}
        ).execute()
    except Exception as e:
        print(f"Error marking as read: {e}")
