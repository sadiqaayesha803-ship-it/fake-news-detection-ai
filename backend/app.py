from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
import pickle
import os
import torch

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

# ============================================================
# FIND MODEL DIRECTORY
# ============================================================
print("⏳ Loading models...")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
print(f"BASE_DIR: {BASE_DIR}")

# Try every possible path Railway might use
possible_model_dirs = [
    os.path.join(BASE_DIR, 'model'),        # /app/model (backend/model)
    os.path.join(BASE_DIR, '..', 'model'),  # /app/../model
    '/app/model',
    '/app/backend/model',
    os.path.join(os.getcwd(), 'model'),
    os.path.join(os.getcwd(), '..', 'model'),
]

model_dir = None
for path in possible_model_dirs:
    abs_path = os.path.abspath(path)
    print(f"Checking: {abs_path}")
    if os.path.exists(abs_path):
        files = os.listdir(abs_path)
        print(f"Found dir: {abs_path}, files: {files}")
        if 'baseline_model.pkl' in files:
            model_dir = abs_path
            print(f"✅ Model dir found: {abs_path}")
            break

if not model_dir:
    print("❌ Model directory not found! Searching entire /app...")
    # Search entire filesystem for the pkl file
    for root, dirs, files in os.walk('/app'):
        if 'baseline_model.pkl' in files:
            model_dir = root
            print(f"✅ Found model at: {root}")
            break

# ============================================================
# LOAD BERT MODEL
# ============================================================
BERT_AVAILABLE = False
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
bert_model = None
bert_tokenizer = None

if model_dir:
    bert_model_path = os.path.join(model_dir, 'bert_fakenews')
    if os.path.exists(bert_model_path):
        try:
            from transformers import BertTokenizer, BertForSequenceClassification
            bert_model = BertForSequenceClassification.from_pretrained(bert_model_path)
            bert_tokenizer = BertTokenizer.from_pretrained(bert_model_path)
            bert_model = bert_model.to(device)
            bert_model.eval()
            BERT_AVAILABLE = True
            print("✅ BERT model loaded!")
        except Exception as e:
            print(f"⚠️ BERT not available: {e}")
    else:
        print("⚠️ BERT model folder not found — using baseline only")

# ============================================================
# LOAD BASELINE MODEL
# ============================================================
baseline_model = None
tfidf = None

if model_dir:
    try:
        baseline_path = os.path.join(model_dir, 'baseline_model.pkl')
        tfidf_path = os.path.join(model_dir, 'tfidf_vectorizer.pkl')
        print(f"Loading baseline from: {baseline_path}")
        with open(baseline_path, 'rb') as f:
            baseline_model = pickle.load(f)
        with open(tfidf_path, 'rb') as f:
            tfidf = pickle.load(f)
        print("✅ Baseline model loaded!")
    except Exception as e:
        print(f"⚠️ Baseline model error: {e}")
else:
    print("❌ Cannot load baseline model - model_dir not found")

print("✅ Startup complete!")

# ============================================================
# DATABASE SETUP
# ============================================================
DB_AVAILABLE = False
try:
    from database import get_db, History, Base, engine
    from auth import (authenticate_user, create_user, create_access_token,
                      verify_token, get_user, get_user_by_email)
    DB_AVAILABLE = True
    print("✅ Database ready!")
except Exception as e:
    print(f"⚠️ Database error: {e}")

# ============================================================
# OTHER MODULES
# ============================================================
SENTIMENT_AVAILABLE = False
try:
    from sentiment import analyze_sentiment
    SENTIMENT_AVAILABLE = True
except Exception as e:
    print(f"⚠️ Sentiment error: {e}")

FACTCHECK_AVAILABLE = False
try:
    from factcheck import check_facts
    FACTCHECK_AVAILABLE = True
except Exception as e:
    print(f"⚠️ Factcheck error: {e}")

URL_AVAILABLE = False
try:
    from url_analyzer import analyze_url
    URL_AVAILABLE = True
except Exception as e:
    print(f"⚠️ URL analyzer error: {e}")

# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================
class NewsRequest(BaseModel):
    text: str
    model: str = "bert"

class URLRequest(BaseModel):
    url: str

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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ============================================================
# ENDPOINTS
# ============================================================
@app.get("/")
def home():
    return {
        "message": "Fake News Detector API is running!",
        "bert_available": BERT_AVAILABLE,
        "baseline_available": baseline_model is not None,
        "db_available": DB_AVAILABLE,
        "model_dir": model_dir,
        "base_dir": BASE_DIR,
        "cwd": os.getcwd()
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "bert_available": BERT_AVAILABLE,
        "baseline_available": baseline_model is not None,
        "db_available": DB_AVAILABLE
    }

@app.post("/predict", response_model=NewsResponse)
def predict(request: NewsRequest):
    text = request.text.strip()
    if not text:
        return NewsResponse(verdict="ERROR", confidence=0.0, model_used="none")

    # Try BERT first
    if BERT_AVAILABLE and bert_model and bert_tokenizer:
        try:
            encoding = bert_tokenizer(
                text, max_length=128, padding='max_length',
                truncation=True, return_tensors='pt'
            )
            input_ids = encoding['input_ids'].to(device)
            attention_mask = encoding['attention_mask'].to(device)
            with torch.no_grad():
                outputs = bert_model(input_ids=input_ids, attention_mask=attention_mask)
                probs = torch.softmax(outputs.logits, dim=1)
                pred = torch.argmax(probs, dim=1).item()
                confidence = probs[0][pred].item() * 100
            verdict = "FAKE" if pred == 1 else "REAL"
            return NewsResponse(verdict=verdict, confidence=round(confidence, 2), model_used="BERT")
        except Exception as e:
            print(f"BERT error: {e}")

    # Baseline fallback
    if baseline_model and tfidf:
        try:
            text_tfidf = tfidf.transform([text])
            pred = baseline_model.predict(text_tfidf)[0]
            proba = baseline_model.predict_proba(text_tfidf)[0]
            confidence = max(proba) * 100
            verdict = "FAKE" if pred == 1 else "REAL"
            return NewsResponse(verdict=verdict, confidence=round(confidence, 2), model_used="Logistic Regression")
        except Exception as e:
            print(f"Baseline error: {e}")

    return NewsResponse(verdict="ERROR", confidence=0.0, model_used="none")

@app.post("/sentiment")
def sentiment(request: NewsRequest):
    if SENTIMENT_AVAILABLE:
        try:
            return analyze_sentiment(request.text)
        except Exception as e:
            return {"error": str(e), "label": "Unknown", "compound": 0.0, "fake_signal": False}
    return {"label": "Unavailable", "compound": 0.0, "fake_signal": False, "positive": 0.0, "negative": 0.0, "neutral": 1.0}

@app.post("/factcheck")
def factcheck(request: NewsRequest):
    if FACTCHECK_AVAILABLE:
        try:
            return check_facts(request.text)
        except Exception as e:
            return {"found": False, "results": [], "message": str(e)}
    return {"found": False, "results": [], "message": "Fact check unavailable"}

@app.post("/analyze-url")
def analyze_url_endpoint(request: URLRequest):
    if URL_AVAILABLE:
        try:
            return analyze_url(request.url)
        except Exception as e:
            return {"error": str(e), "trust_score": 50, "status": "Unknown"}
    return {"trust_score": 50, "status": "URL analyzer unavailable", "domain": ""}

@app.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if not DB_AVAILABLE:
        return {"error": "Database not available"}
    if get_user(db, request.username):
        return {"error": "Username already exists"}
    if get_user_by_email(db, request.email):
        return {"error": "Email already exists"}
    user = create_user(db, request.username, request.email, request.password)
    token = create_access_token({"sub": user.username})
    return {"message": "Registration successful!", "token": token, "username": user.username, "id": user.id}

@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    if not DB_AVAILABLE:
        return {"error": "Database not available"}
    user = authenticate_user(db, request.username, request.password)
    if not user:
        return {"error": "Invalid username or password"}
    token = create_access_token({"sub": user.username})
    return {"message": "Login successful!", "token": token, "username": user.username, "id": user.id}

@app.post("/history/save")
def save_history(
    request: HistorySaveRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    if not DB_AVAILABLE:
        return {"error": "Database not available"}
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

@app.get("/history/{user_id}")
def get_history(
    user_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    if not DB_AVAILABLE:
        return {"error": "Database not available"}
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

# Admin endpoint - get all users
@app.get("/admin/users")
def get_all_users(db: Session = Depends(get_db)):
    from database import User
    users = db.query(User).all()
    return {
        "total_users": len(users),
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "created_at": u.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for u in users
        ]
    }

# Admin endpoint - get all history
@app.get("/admin/history")
def get_all_history(db: Session = Depends(get_db)):
    records = db.query(History).order_by(History.created_at.desc()).all()
    return {
        "total_checks": len(records),
        "fake_count": len([r for r in records if r.verdict == "FAKE"]),
        "real_count": len([r for r in records if r.verdict == "REAL"]),
        "history": [
            {
                "id": r.id,
                "user_id": r.user_id,
                "article_text": r.article_text[:100] + "...",
                "verdict": r.verdict,
                "confidence": r.confidence,
                "model_used": r.model_used,
                "date": r.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for r in records
        ]
    }