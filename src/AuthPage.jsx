import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://192.168.100.72:8000';

function HistoryPage({ user, onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/history/${user.id}`);
      setHistory(res.data.history);
    } catch {
      console.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    await axios.delete(`${API}/history/${id}`);
    setHistory(history.filter(item => item.id !== id));
  };

  return (
    <div className="App">
      <nav className="navbar">
        <h1>📋 My History</h1>
        <div>
          <span style={{marginRight:'15px'}}>👤 {user?.username}</span>
          <button className="back-btn" onClick={onBack}>⬅ Back</button>
        </div>
      </nav>

      <div className="container">
        {loading && <p>⏳ Loading history...</p>}

        {!loading && history.length === 0 && (
          <div className="empty-history">
            <p>📭 No history yet — go check some news!</p>
          </div>
        )}

        {history.map(item => (
          <div key={item.id} className={`history-card ${item.verdict === 'FAKE' ? 'fake' : 'real'}`}>
            <div className="history-header">
              <span className={`verdict-badge ${item.verdict === 'FAKE' ? 'fake' : 'real'}`}>
                {item.verdict === 'FAKE' ? '🔴 FAKE' : '🟢 REAL'}
              </span>
              <span className="history-date">
                🕐 {new Date(item.checked_at).toLocaleString()}
              </span>
              <button className="delete-btn" onClick={() => deleteItem(item.id)}>🗑️</button>
            </div>
            <p className="history-text">
              {item.article_text.length > 200
                ? item.article_text.substring(0, 200) + '...'
                : item.article_text}
            </p>
            <div className="history-meta">
              <span>📊 Confidence: {item.confidence}%</span>
              <span>🤖 Model: {item.model_used}</span>
              {item.author && <span>✍️ Author: {item.author}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HistoryPage;