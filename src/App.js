/* eslint-disable */
import AdminPage from './AdminPage';
import React, { useState } from 'react';
import axios from 'axios';
import ResultCard from './ResultCard';
import AuthPage from './AuthPage';
import HistoryPage from './HistoryPage';
import './App.css';

const API = 'https://fake-news-detection-ai-production.up.railway.app';

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [newsText, setNewsText] = useState('');
  const [author, setAuthor] = useState('');
  const [result, setResult] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [factcheck, setFactcheck] = useState(null);
  const [urlResult, setUrlResult] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);

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
    setSentiment(null);
    setFactcheck(null);

    try {
      const [predictRes, sentimentRes, factcheckRes] = await Promise.all([
        axios.post(`${API}/predict`, { text: newsText, model: 'bert' }),
        axios.post(`${API}/sentiment`, { text: newsText, model: 'bert' }),
        axios.post(`${API}/factcheck`, { text: newsText.slice(0, 100), model: 'bert' })
      ]);

      setResult(predictRes.data);
      setSentiment(sentimentRes.data);
      setFactcheck(factcheckRes.data);

      if (user) {
        await axios.post(`${API}/history/save`,
          {
            article_text: newsText,
            verdict: predictRes.data.verdict,
            confidence: predictRes.data.confidence,
            model_used: predictRes.data.model_used
          },
          {
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );
      }

    } catch (err) {
      setError('❌ Cannot connect to API. Make sure backend is running!');
    } finally {
      setLoading(false);
    }
  };

  const checkUrl = async () => {
    if (!url.trim()) return;
    try {
      const res = await axios.post(`${API}/analyze-url`, { url: url });
      setUrlResult(res.data);
    } catch (err) {
      setError('❌ URL check failed!');
    }
  };

  if (showAdmin) return <AdminPage onBack={() => setShowAdmin(false)} />;
  // Show login page if not logged in
  if (!user) return <AuthPage onLogin={handleLogin} />;

  // Show history page
  if (page === 'history') {
    return <HistoryPage user={user} onBack={() => setPage('home')} />;
  }

  return (
    <div className="App">
      {/* Navbar */}
      <nav className="navbar">
        <h1>🔍 Fake News Detector</h1>
        <div>
          <span style={{ marginRight: '15px', color: 'white' }}>
            👤 {user.username}
          </span>
          <button
            className="nav-btn"
            onClick={() => setPage('history')}
            style={{
              marginRight: '10px',
              padding: '8px 15px',
              backgroundColor: '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
<button
  onClick={() => setShowAdmin(true)}
  style={{
    marginRight: '10px',
    padding: '8px 15px',
    backgroundColor: '#1A56DB',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }}
>
  ⚙️ Admin
</button>
            📋 My History
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 15px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </nav>

      <div className="container">
        <h2>Is This News Real or Fake?</h2>
        <p>Paste any news article and our AI analyzes it instantly</p>

        {/* Author Input */}
        <input
          type="text"
          placeholder="Enter author or publisher name (optional)..."
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            borderRadius: '8px',
            border: '2px solid #ddd',
            fontSize: '14px'
          }}
        />

        {/* News Input */}
        <textarea
          className="news-input"
          rows="8"
          placeholder="Paste your news article here..."
          value={newsText}
          onChange={(e) => setNewsText(e.target.value)}
        />
        <p style={{ textAlign: 'right', color: '#aaa', fontSize: '13px' }}>
          {newsText.length} characters
        </p>

        {/* Check Button */}
        <button
          className="check-btn"
          onClick={checkNews}
          disabled={loading}
        >
          {loading ? '⏳ Analyzing...' : '🔍 Check News'}
        </button>

        {/* URL Checker */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '10px' }}>🌐 Check URL Credibility</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Paste news URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                fontSize: '14px'
              }}
            />
            <button
              onClick={checkUrl}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2c3e50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Check URL
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-card">
            <p>{error}</p>
          </div>
        )}

        {/* AI Verdict */}
        <ResultCard result={result} />

        {/* Sentiment Result */}
        {sentiment && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #3498db',
            backgroundColor: '#f0f8ff'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>
              🎭 Sentiment Analysis
            </h3>
            <p>Tone: <strong>{sentiment.label}</strong></p>
            <p>Compound Score: <strong>{sentiment.compound}</strong></p>
            <p>Fake Signal: <strong>
              {sentiment.fake_signal ? '⚠️ Yes — Extreme Bias Detected!' : '✅ No — Normal Tone'}
            </strong></p>
          </div>
        )}

        {/* Fact Check Result */}
        {factcheck && factcheck.found && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #e67e22',
            backgroundColor: '#fff8f0'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>
              📋 Fact Check Results
            </h3>
            {factcheck.results.map((item, index) => (
              <div key={index} style={{
                padding: '10px',
                borderBottom: '1px solid #ddd',
                marginBottom: '10px'
              }}>
                <p><strong>Claim:</strong> {item.text}</p>
                {item.reviews.map((review, i) => (
                  <p key={i}>
                    <strong>{review.publisher}:</strong> {review.rating}
                    {' '}<a href={review.url}
                    target="_blank"
                    rel="noreferrer">🔗 Read</a>
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* URL Result */}
        {urlResult && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            borderRadius: '12px',
            border: `2px solid ${urlResult.trust_score > 70 ? '#2ecc71' :
                     urlResult.trust_score > 40 ? '#f39c12' : '#e74c3c'}`,
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>
              🌐 URL Credibility
            </h3>
            <p>Domain: <strong>{urlResult.domain}</strong></p>
            <p>Trust Score: <strong>{urlResult.trust_score}/100</strong></p>
            <p>Status: <strong>{urlResult.status}</strong></p>
            <div style={{
              width: '100%',
              height: '15px',
              backgroundColor: '#eee',
              borderRadius: '8px',
              overflow: 'hidden',
              marginTop: '10px'
            }}>
              <div style={{
                width: `${urlResult.trust_score}%`,
                height: '100%',
                backgroundColor: urlResult.trust_score > 70 ? '#2ecc71' :
                                 urlResult.trust_score > 40 ? '#f39c12' : '#e74c3c',
                borderRadius: '8px'
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;