from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

def analyze_sentiment(text):
    if not text or len(text.strip()) == 0:
        return {
            "compound": 0.0,
            "positive": 0.0,
            "negative": 0.0,
            "neutral": 0.0,
            "label": "Neutral",
            "fake_signal": False
        }

    scores = analyzer.polarity_scores(text)
    compound = scores['compound']

    if compound >= 0.05:
        label = "Positive"
    elif compound <= -0.05:
        label = "Negative"
    else:
        label = "Neutral"

    fake_signal = abs(compound) > 0.5

    return {
        "compound": round(compound, 4),
        "positive": round(scores['pos'], 4),
        "negative": round(scores['neg'], 4),
        "neutral": round(scores['neu'], 4),
        "label": label,
        "fake_signal": fake_signal
    }