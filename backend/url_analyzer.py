import requests
from bs4 import BeautifulSoup

# Trusted domains
TRUSTED_DOMAINS = {
    "reuters.com": 95,
    "bbc.com": 93,
    "bbc.co.uk": 93,
    "apnews.com": 92,
    "cnn.com": 80,
    "dawn.com": 85,
    "geo.tv": 75,
    "nytimes.com": 85,
    "theguardian.com": 85,
    "npr.org": 88,
    "washingtonpost.com": 82,
    "aljazeera.com": 78
}

# Blacklisted domains
BLACKLISTED_DOMAINS = {
    "infowars.com": 5,
    "naturalnews.com": 8,
    "beforeitsnews.com": 10,
    "yournewswire.com": 5,
    "worldnewsdailyreport.com": 3,
    "thedailysheeple.com": 8
}

def get_domain(url):
    try:
        url = url.replace("https://", "").replace("http://", "").replace("www.", "")
        domain = url.split("/")[0]
        return domain.lower()
    except:
        return ""

def scrape_text(url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Remove scripts and styles
        for tag in soup(['script', 'style', 'nav', 'footer']):
            tag.decompose()

        # Get text
        text = soup.get_text(separator=' ', strip=True)
        text = ' '.join(text.split())

        return text[:2000]  # First 2000 chars
    except Exception as e:
        return ""

def analyze_url(url):
    if not url or len(url.strip()) == 0:
        return {
            "url": url,
            "domain": "",
            "trust_score": 0,
            "status": "Invalid URL",
            "text_extracted": "",
            "error": "No URL provided"
        }

    domain = get_domain(url)

    # Check trusted
    if domain in TRUSTED_DOMAINS:
        trust_score = TRUSTED_DOMAINS[domain]
        status = "Trusted Source"

    # Check blacklisted
    elif domain in BLACKLISTED_DOMAINS:
        trust_score = BLACKLISTED_DOMAINS[domain]
        status = "Blacklisted Source"

    # Unknown domain
    else:
        trust_score = 50
        status = "Unknown Source"

    # Scrape text
    text = scrape_text(url)

    return {
        "url": url,
        "domain": domain,
        "trust_score": trust_score,
        "status": status,
        "text_extracted": text[:500] if text else "Could not extract text",
        "error": None
    }