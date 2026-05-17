import requests

FACT_CHECK_API_KEY = "AIzaSyDRxcjqAdCiqsl4j2HxwFTlLa1TB23UAjc"
FACT_CHECK_URL = "https://factchecktools.googleapis.com/v1alpha1/claims:search"

def check_facts(query):
    if not query or len(query.strip()) == 0:
        return {
            "found": False,
            "results": [],
            "message": "No query provided"
        }

    try:
        params = {
            "query": query,
            "key": FACT_CHECK_API_KEY,
            "languageCode": "en"
        }

        response = requests.get(FACT_CHECK_URL, params=params)
        data = response.json()

        if "claims" not in data or len(data["claims"]) == 0:
            return {
                "found": False,
                "results": [],
                "message": "No fact checks found for this claim"
            }

        results = []
        for claim in data["claims"][:3]:
            result = {
                "text": claim.get("text", ""),
                "claimant": claim.get("claimant", "Unknown"),
                "reviews": []
            }

            for review in claim.get("claimReview", []):
                result["reviews"].append({
                    "publisher": review.get("publisher", {}).get("name", "Unknown"),
                    "rating": review.get("textualRating", "Unknown"),
                    "url": review.get("url", "")
                })

            results.append(result)

        return {
            "found": True,
            "results": results,
            "message": f"Found {len(results)} fact check(s)"
        }

    except Exception as e:
        return {
            "found": False,
            "results": [],
            "message": f"Error: {str(e)}"
        }