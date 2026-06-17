import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://192.168.100.72:8000';

function HistoryPage({ user, onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(
        `${API}/history/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );
      setHistory(response.data.history || []);
    } catch (err) {
      setError('❌ Failed to load history!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Navbar */}
      <nav className="navbar">
        <h1>🔍 Fake News Detector</h1>
        <button
          onClick={onBack}
          style={{
            padding: '8px 15px',
            backgroundColor: '#34495e',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Back to Home
        </button>
      </nav>

      <div className="container">
        <h2>📋 My History</h2>
        <p>Articles you have checked before</p>

        {/* Loading */}
        {loading && (
          <p style={{ textAlign: 'center', color: '#888' }}>
            ⏳ Loading history...
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="error-card">
            <p>{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && history.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#888'
          }}>
            <h3>No history yet!</h3>
            <p>Go check some news first!</p>
            <button
              onClick={onBack}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                backgroundColor: '#2c3e50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🔍 Check News
            </button>
          </div>
        )}

        {/* History List */}
        {history.map((item, index) => (
          <div key={index} style={{
            padding: '20px',
            marginBottom: '15px',
            borderRadius: '12px',
            border: `2px solid ${item.verdict === 'FAKE' ? '#e74c3c' : '#2ecc71'}`,
            backgroundColor: item.verdict === 'FAKE' ? '#fff3f3' : '#f0fff4'
          }}>
            {/* Verdict Badge */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{
                backgroundColor: item.verdict === 'FAKE' ? '#e74c3c' : '#2ecc71',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {item.verdict === 'FAKE' ? '🔴 FAKE' : '🟢 REAL'}
              </span>
              <span style={{ color: '#888', fontSize: '13px' }}>
                📅 {item.date}
              </span>
            </div>

            {/* Article Text */}
            <p style={{ color: '#333', marginBottom: '10px' }}>
              {item.article_text}
            </p>

            {/* Confidence */}
            <p style={{ color: '#666', fontSize: '14px' }}>
              Confidence: <strong>{item.confidence}%</strong> |
              Model: <strong>{item.model_used}</strong>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HistoryPage;