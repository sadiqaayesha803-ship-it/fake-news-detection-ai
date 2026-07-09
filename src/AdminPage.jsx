/* eslint-disable */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'https://fake-news-detection-ai-production.up.railway.app';
const ADMIN_PASSWORD = 'admin123';

function AdminPage({ onBack }) {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      fetchData();
    } else {
      setError('Wrong admin password!');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, historyRes] = await Promise.all([
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/admin/history`)
      ]);
      setUsers(usersRes.data.users || []);
      setHistory(historyRes.data.history || []);
      setStats({
        total_users: usersRes.data.total_users,
        total_checks: historyRes.data.total_checks,
        fake_count: historyRes.data.fake_count,
        real_count: historyRes.data.real_count,
      });
    } catch (err) {
      setError('Failed to load admin data!');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#0D1B2A',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: '#1E293B', padding: '40px',
          borderRadius: '12px', border: '2px solid #1A56DB',
          width: '350px', textAlign: 'center'
        }}>
          <h2 style={{ color: 'white', marginBottom: '10px' }}>🔐 Admin Panel</h2>
          <p style={{ color: '#94A3B8', marginBottom: '20px' }}>Enter admin password</p>
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '12px', marginBottom: '15px',
              borderRadius: '8px', border: '2px solid #334155',
              backgroundColor: '#0D1B2A', color: 'white', fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {error && <p style={{ color: '#EF4444', marginBottom: '10px' }}>{error}</p>}
          <button onClick={handleLogin} style={{
            width: '100%', padding: '12px', backgroundColor: '#1A56DB',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '14px', cursor: 'pointer'
          }}>
            Login as Admin
          </button>
          <button onClick={onBack} style={{
            width: '100%', padding: '10px', backgroundColor: 'transparent',
            color: '#94A3B8', border: 'none', cursor: 'pointer', marginTop: '10px'
          }}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0D1B2A' }}>
      {/* Navbar */}
      <nav style={{
        backgroundColor: '#1E293B', padding: '15px 30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '2px solid #1A56DB'
      }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '20px' }}>
          🔍 Fake News Detector — Admin Panel
        </h1>
        <button onClick={onBack} style={{
          padding: '8px 15px', backgroundColor: '#334155',
          color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
        }}>
          ← Back to Site
        </button>
      </nav>

      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Stats Cards */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Users', value: stats.total_users, color: '#1A56DB' },
            { label: 'Total Checks', value: stats.total_checks, color: '#10B981' },
            { label: 'Fake Detected', value: stats.fake_count, color: '#EF4444' },
            { label: 'Real News', value: stats.real_count, color: '#10B981' },
          ].map((stat, i) => (
            <div key={i} style={{
              backgroundColor: '#1E293B', padding: '20px',
              borderRadius: '12px', border: `2px solid ${stat.color}`,
              flex: '1', minWidth: '150px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: stat.color }}>
                {stat.value || 0}
              </div>
              <div style={{ color: '#94A3B8', fontSize: '13px', marginTop: '5px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {['users', 'history'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 25px',
              backgroundColor: activeTab === tab ? '#1A56DB' : '#1E293B',
              color: 'white', border: '2px solid #1A56DB',
              borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
              fontWeight: activeTab === tab ? 'bold' : 'normal'
            }}>
              {tab === 'users' ? '👥 Users' : '📋 History'}
            </button>
          ))}
          <button onClick={fetchData} style={{
            padding: '10px 20px', backgroundColor: '#10B981',
            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
          }}>
            🔄 Refresh
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div style={{
            backgroundColor: '#1E293B', borderRadius: '12px',
            border: '2px solid #334155', overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1A56DB' }}>
                  {['ID', 'Username', 'Email', 'Registered At'].map(h => (
                    <th key={h} style={{
                      padding: '12px 15px', color: 'white',
                      textAlign: 'left', fontSize: '13px'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user.id} style={{
                    backgroundColor: i % 2 === 0 ? '#1E293B' : '#162032',
                    borderBottom: '1px solid #334155'
                  }}>
                    <td style={{ padding: '12px 15px', color: '#94A3B8' }}>{user.id}</td>
                    <td style={{ padding: '12px 15px', color: 'white', fontWeight: 'bold' }}>{user.username}</td>
                    <td style={{ padding: '12px 15px', color: '#94A3B8' }}>{user.email}</td>
                    <td style={{ padding: '12px 15px', color: '#94A3B8' }}>{user.created_at}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                      No users registered yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div style={{
            backgroundColor: '#1E293B', borderRadius: '12px',
            border: '2px solid #334155', overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1A56DB' }}>
                  {['ID', 'User ID', 'Article', 'Verdict', 'Confidence', 'Model', 'Date'].map(h => (
                    <th key={h} style={{
                      padding: '12px 15px', color: 'white',
                      textAlign: 'left', fontSize: '13px'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <tr key={item.id} style={{
                    backgroundColor: i % 2 === 0 ? '#1E293B' : '#162032',
                    borderBottom: '1px solid #334155'
                  }}>
                    <td style={{ padding: '10px 15px', color: '#94A3B8' }}>{item.id}</td>
                    <td style={{ padding: '10px 15px', color: '#94A3B8' }}>{item.user_id}</td>
                    <td style={{ padding: '10px 15px', color: 'white', fontSize: '12px', maxWidth: '200px' }}>
                      {item.article_text}
                    </td>
                    <td style={{ padding: '10px 15px' }}>
                      <span style={{
                        backgroundColor: item.verdict === 'FAKE' ? '#EF444433' : '#10B98133',
                        color: item.verdict === 'FAKE' ? '#EF4444' : '#10B981',
                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'
                      }}>
                        {item.verdict === 'FAKE' ? '🔴 FAKE' : '🟢 REAL'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 15px', color: '#94A3B8' }}>{item.confidence}%</td>
                    <td style={{ padding: '10px 15px', color: '#94A3B8', fontSize: '12px' }}>{item.model_used}</td>
                    <td style={{ padding: '10px 15px', color: '#94A3B8', fontSize: '12px' }}>{item.date}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                      No history yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;