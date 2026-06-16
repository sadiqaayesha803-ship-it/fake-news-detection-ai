import React from 'react';

function ResultCard({ result }) {
  if (!result) return null;

  return (
    <div className="result-card">

      <h3>🧠 Prediction: {result.prediction}</h3>

      <p>👤 Author Score: {result.author_score}</p>

      {/* STEP 8 logic */}
      <h4>
        {result.author_score > 80
          ? "Trusted Source ✅"
          : result.author_score > 50
          ? "Average ⚠️"
          : "Low Credibility ❌"}
      </h4>

    </div>
  );
}

export default ResultCard;