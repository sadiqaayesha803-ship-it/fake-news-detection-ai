from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db, History, Base, engine
from auth import (authenticate_user, create_user, create_access_token,
                  verify_token, get_user, get_user_by_email)
from url_analyzer import analyze_url
from factcheck import check_facts
from sentiment import analyze_sentiment
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import BertTokenizer, BertForSequenceClassification
import pickle
import os

# Initialize app
app = FastAPI(title="Fake News Detector API")

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models on startup
print("⏳ Loading models...")

# Load BERT model
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
bert_model = BertForSequenceClassification.from_pretrained('../model/bert_fakenews')
bert_tokenizer = BertTokenizer.from_pretrained('../model/bert_fakenews')
bert_model = bert_model.to(device)
bert_model.eval()

# Load baseline model
with open('../model/baseline_model.pkl', 'rb') as f:
    baseline_model = pickle.load(f)

with open('../model/tfidf_vectorizer.pkl', 'rb') as f:
    tfidf = pickle.load(f)

print("✅ All models loaded!")

# Request body
class NewsRequest(BaseModel):
    text: str
    model: str = "bert"  # "bert" or "baseline"
class URLRequest(BaseModel):
    url: str

# Response body
class NewsResponse(BaseModel):
    verdict: str
    confidence: float
    model_used: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class HistorySaveRequest(BaseModel):
    article_text: str
    verdict: str
    confidence: float
    model_used: str
# Root endpoint
@app.get("/")
def home():
    return {"message": "Fake News Detector API is running!"}

# Predict endpoint
@app.post("/predict", response_model=NewsResponse)
def predict(request: NewsRequest):
    text = request.text.strip()

    if not text:
        return NewsResponse(
            verdict="ERROR",
            confidence=0.0,
            model_used="none"
        )

    if request.model == "bert":
        # BERT prediction
        encoding = bert_tokenizer(
            text,
            max_length=128,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )

        input_ids = encoding['input_ids'].to(device)
        attention_mask = encoding['attention_mask'].to(device)

        with torch.no_grad():
            outputs = bert_model(
                input_ids=input_ids,
                attention_mask=attention_mask
            )
            probs = torch.softmax(outputs.logits, dim=1)
            pred = torch.argmax(probs, dim=1).item()
            confidence = probs[0][pred].item() * 100

        verdict = "FAKE" if pred == 1 else "REAL"
        model_used = "BERT"

    else:
        # Baseline prediction
        text_tfidf = tfidf.transform([text])
        pred = baseline_model.predict(text_tfidf)[0]
        proba = baseline_model.predict_proba(text_tfidf)[0]
        confidence = max(proba) * 100
        verdict = "FAKE" if pred == 1 else "REAL"
        model_used = "Logistic Regression"

    return NewsResponse(
        verdict=verdict,
        confidence=round(confidence, 2),
        model_used=model_used
    )
@app.post("/sentiment")
def sentiment(request: NewsRequest):
    result = analyze_sentiment(request.text)
    return result
# Fact Check endpoint
@app.post("/factcheck")
def factcheck(request: NewsRequest):
    result = check_facts(request.text)
    return result
# URL Analyzer endpoint
@app.post("/analyze-url")
def analyze_url_endpoint(request: URLRequest):
    result = analyze_url(request.url)
    return result

# Health check
@app.get("/health")
def health():
    return {"status": "healthy", "models": ["BERT", "Logistic Regression"]}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Register endpoint
@app.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if username exists
    if get_user(db, request.username):
        return {"error": "Username already exists"}

    # Check if email exists
    if get_user_by_email(db, request.email):
        return {"error": "Email already exists"}

    # Create user
    user = create_user(db, request.username, request.email, request.password)
    token = create_access_token({"sub": user.username})

    return {
        "message": "Registration successful!",
        "token": token,
        "username": user.username,
        "id": user.id
    }

# Login endpoint
@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.username, request.password)
    if not user:
        return {"error": "Invalid username or password"}

    token = create_access_token({"sub": user.username})

    return {
        "message": "Login successful!",
        "token": token,
        "username": user.username,
        "id": user.id
    }

# Save history endpoint
@app.post("/history/save")
def save_history(
    request: HistorySaveRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    username = verify_token(token)
    if not username:
        return {"error": "Invalid token"}

    user = get_user(db, username)
    if not user:
        return {"error": "User not found"}

    history = History(
        user_id=user.id,
        article_text=request.article_text[:500],
        verdict=request.verdict,
        confidence=request.confidence,
        model_used=request.model_used
    )
    db.add(history)
    db.commit()

    return {"message": "History saved!"}

# Get history endpoint
@app.get("/history/{user_id}")
def get_history(
    user_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    username = verify_token(token)
    if not username:
        return {"error": "Invalid token"}

    records = db.query(History).filter(
        History.user_id == user_id
    ).order_by(History.created_at.desc()).limit(20).all()

    return {
        "history": [
            {
                "id": r.id,
                "article_text": r.article_text[:100] + "...",
                "verdict": r.verdict,
                "confidence": r.confidence,
                "model_used": r.model_used,
                "date": r.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for r in records
        ]
    }

# Sentiment endpoint
@app.post("/sentiment")
def sentiment_api(data: dict):

    text = data.get("text", "")

    if not text.strip():
        return {
            "label": "ERROR",
            "score": 0.0
        }

    result = analyze_sentiment(text)

    return result