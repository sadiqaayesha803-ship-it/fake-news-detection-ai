import React, { useState } from 'react';
import axios from 'axios';
import ResultCard from './ResultCard';
import AuthPage from './AuthPage';
import HistoryPage from './HistoryPage';
import './App.css';

const API = 'https://your-actual-railway-url.up.railway.app';

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');

  const [newsText, setNewsText] = useState('');
  const [author, setAuthor] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (userData) => {
    setUser(userData);
    setPage('home');
  };

  const handleLogout = () => {
    setUser(null);
    setResult(null);
    setPage('home');
  };

  const checkNews = async () => {
    if (!newsText.trim()) {
      setError('⚠️ Please enter some news text!');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${API}/predict`, {
        text: newsText,
        model: 'bert',
        author: author
      });

      setResult(response.data);

      if (user) {
        await axios.post(`${API}/history/save`, {
          user_id: user.id,
          article_text: newsText,
          verdict: response.data.verdict,
          confidence: response.data.confidence,
          model_used: response.data.model_used,
          author: author,
          author_score: response.data.author_score,
          author_category: response.data.author_category
        });
      }

    } catch (err) {
      setError('❌ Cannot connect to API. Make sure backend is running!');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED NAVIGATION FLOW
  //if (!user) return <AuthPage onLogin={handleLogin} />;

  if (page === 'history') {
    return (
      <HistoryPage
        user={user}
        onBack={() => setPage('home')}
      />
    );
  }

  return (
    <div className="App">

      <nav className="navbar">
        <h1>🔍 Fake News Detector</h1>

        <div>
          <span style={{ marginRight: '15px' }}>
            👤 {user.username}
          </span>

          <button
            className="nav-btn"
            onClick={() => setPage('history')}
          >
            📋 My History
          </button>

          <button
            className="nav-btn logout"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      </nav>

      <div className="container">
        <h2>Is This News Real or Fake?</h2>
        <p>Paste any news article below and our AI will analyze it instantly</p>

        <input
          type="text"
          className="author-input"
          placeholder="Enter author or publisher name (optional)..."
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />

        <textarea
          className="news-input"
          rows="10"
          placeholder="Paste your news article here..."
          value={newsText}
          onChange={(e) => setNewsText(e.target.value)}
        />

        <p style={{ textAlign: 'right', color: '#aaa', fontSize: '13px' }}>
          {newsText.length} characters
        </p>

        <button
          className="check-btn"
          onClick={checkNews}
          disabled={loading}
        >
          {loading ? '⏳ Analyzing...' : '🔍 Check News'}
        </button>

        {error && (
          <div className="error-card">
            <p>{error}</p>
          </div>
        )}

        <ResultCard result={result} />
      </div>

    </div>
  );
}

export default App;