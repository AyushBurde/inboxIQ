from sqlalchemy import Column, Integer, String, Text
from .db import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50))        # gmail / linkedin
    sender = Column(String(255))
    subject = Column(String(500))
    body = Column(Text)

    # AI fields
    summary = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    priority = Column(String(50), nullable=True)
    action_required = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)


class GoogleAccount(Base):
    __tablename__ = "google_accounts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    access_token = Column(String(2048))
    refresh_token = Column(String(2048))
