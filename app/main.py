from flask import Flask
from flask_cors import CORS
from .db import Base, engine
from .api import messages, auth

Base.metadata.create_all(bind=engine)

app = Flask(__name__)

# Add CORS so the Vite frontend (localhost:5173) can talk to the backend
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

app.register_blueprint(messages.bp, url_prefix="/api")
app.register_blueprint(auth.bp, url_prefix="/api/auth")

if __name__ == "__main__":
    app.run(port=8000, debug=True)