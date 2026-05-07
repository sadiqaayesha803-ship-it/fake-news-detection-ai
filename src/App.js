import React, { useState } from 'react';
import axios from 'axios';
import ResultCard from './ResultCard';
import './App.css';

function App() {
  const [newsText, setNewsText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkNews = async () => {
    if (!newsText.trim()) {
      setError('⚠️ Please enter some news text!');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('http://localhost:8000/predict', {
        text: newsText,
        model: 'bert'
      });
      setResult(response.data);
    } catch (err) {
      setError('❌ Cannot connect to API. Make sure backend is running!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Navbar */}
      <nav className="navbar">
        <h1>🔍 Fake News Detector</h1>
        <span>Powered by BERT AI</span>
      </nav>

      {/* Main Content */}
      <div className="container">
        <h2>Is This News Real or Fake?</h2>
        <p>Paste any news article below and our AI will analyze it instantly</p>

        {/* Input Box */}
        <textarea
          className="news-input"
          rows="10"
          placeholder="Paste your news article here..."
          value={newsText}
          onChange={(e) => setNewsText(e.target.value)}
        />

        {/* Character Count */}
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

        {/* Error Message */}
        {error && (
          <div className="error-card">
            <p>{error}</p>
          </div>
        )}

        {/* Result Card Component */}
        <ResultCard result={result} />
      </div>
    </div>
  );
}

export default App;