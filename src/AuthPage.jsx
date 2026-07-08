/* eslint-disable */
import React, { useState } from 'react';
import axios from 'axios';

const API = 'https://fake-news-detection-ai-production.up.railway.app';

function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('Please fill all fields!');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const data = isLogin
        ? { username, password }
        : { username, email, password };

      const response = await axios.post(`${API}${endpoint}`, data);

      if (response.data.error) {
        setError(response.data.error);
      } else {
        localStorage.setItem('token', response.data.token);
        onLogin({
          id: response.data.id,
          username: response.data.username,
          token: response.data.token
        });
      }
    } catch (err) {
      setError('❌ Cannot connect to server!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '400px'
      }}>
        {/* Title */}
        <h1 style={{
          textAlign: 'center',
          color: '#2c3e50',
          marginBottom: '10px'
        }}>
          🔍 Fake News Detector
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#888',
          marginBottom: '30px'
        }}>
          {isLogin ? 'Login to your account' : 'Create new account'}
        </p>

        {/* Username */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '15px',
            borderRadius: '8px',
            border: '2px solid #ddd',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />

        {/* Email (Register only) */}
        {!isLogin && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '15px',
              borderRadius: '8px',
              border: '2px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        )}

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '8px',
            border: '2px solid #ddd',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />

        {/* Error */}
        {error && (
          <p style={{
            color: '#e74c3c',
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            {error}
          </p>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2c3e50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}
        >
          {loading ? '⏳ Please wait...' : isLogin ? '🔐 Login' : '📝 Register'}
        </button>

        {/* Toggle Login/Register */}
        <p style={{ textAlign: 'center', color: '#888' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ color: '#2c3e50', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;