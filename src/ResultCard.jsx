import React from 'react';

function ResultCard({ result }) {
  if (!result) return null;

  const isFake = result.verdict === 'FAKE';

  return (
    <div style={{
      marginTop: '30px',
      padding: '30px',
      borderRadius: '12px',
      border: `3px solid ${isFake ? '#e74c3c' : '#2ecc71'}`,
      backgroundColor: isFake ? '#fff3f3' : '#f0fff4',
      textAlign: 'center',
      animation: 'fadeIn 0.5s ease'
    }}>
      {/* Verdict */}
      <h2 style={{
        fontSize: '36px',
        color: isFake ? '#e74c3c' : '#2ecc71',
        marginBottom: '15px'
      }}>
        {isFake ? '🔴 FAKE NEWS' : '🟢 REAL NEWS'}
      </h2>

      {/* Confidence Score */}
      <p style={{ fontSize: '18px', marginBottom: '10px' }}>
        Confidence: <strong>{result.confidence}%</strong>
      </p>

      {/* Model Used */}
      <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
        Model: <strong>{result.model_used}</strong>
      </p>

      {/* Confidence Bar */}
      <div style={{
        width: '100%',
        height: '20px',
        backgroundColor: '#eee',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div style={{
          width: `${result.confidence}%`,
          height: '100%',
          backgroundColor: isFake ? '#e74c3c' : '#2ecc71',
          borderRadius: '10px',
          transition: 'width 1s ease'
        }} />
      </div>

      {/* Warning Message */}
      {isFake && (
        <div style={{
          backgroundColor: '#ffe0e0',
          border: '1px solid #e74c3c',
          borderRadius: '8px',
          padding: '10px',
          marginTop: '10px'
        }}>
          <p style={{ color: '#c0392b', fontSize: '14px' }}>
            ⚠️ This article shows signs of misinformation.
            Please verify with trusted sources.
          </p>
        </div>
      )}

      {/* Success Message */}
      {!isFake && (
        <div style={{
          backgroundColor: '#e0ffe8',
          border: '1px solid #2ecc71',
          borderRadius: '8px',
          padding: '10px',
          marginTop: '10px'
        }}>
          <p style={{ color: '#27ae60', fontSize: '14px' }}>
            ✅ This article appears to be legitimate news.
          </p>
        </div>
      )}
    </div>
  );
}

export default ResultCard;