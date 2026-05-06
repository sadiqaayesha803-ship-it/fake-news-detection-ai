from fastapi import FastAPI
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

# Response body
class NewsResponse(BaseModel):
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

# Health check
@app.get("/health")
def health():
    return {"status": "healthy", "models": ["BERT", "Logistic Regression"]}