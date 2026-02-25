import { useState, useEffect } from 'react'
import { loginWithGoogle, getMessages, syncMessages } from './api'
import './index.css'

function App() {
  const [messages, setMessages] = useState([])
  const [selectedMsg, setSelectedMsg] = useState(null)
  const [isLogged, setIsLogged] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [currentUser, setCurrentUser] = useState(null) // in a real app, we'd fetch actual user info

  // Check if we just logged in via URL callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'success') {
      setIsLogged(true);
      const email = urlParams.get('email');
      if (email) {
        setCurrentUser(email);
      } else {
        setCurrentUser("user@example.com"); // fallback just in case
      }
      fetchMessages();
      // Clean up URL
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const fetchMessages = async () => {
    const data = await getMessages()
    setMessages(data)
  }

  const handleSync = async () => {
    if (!currentUser) return alert("Please log in first")
    setIsSyncing(true)
    try {
      await syncMessages(currentUser)
      await fetchMessages() // Refresh list
    } catch (e) {
      alert("Error syncing: " + e.message)
    } finally {
      setIsSyncing(false)
    }
  }

  // ---- Login Screen ----
  if (!isLogged) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Unified Opportunity Inbox</h1>
          <p>Connect your email to let AI automatically sort, summarize, and highlight opportunities.</p>
          <button className="login-btn" onClick={loginWithGoogle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    )
  }

  // ---- Main Dashboard ----
  return (
    <div className="app-container">

      {/* Sidebar */}
      <div className="sidebar">
        <h2 style={{ fontSize: '18px', marginBottom: '32px' }}>unified.inbox</h2>
        <button
          className="sync-btn"
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? 'Syncing...' : 'Sync New Emails'}
        </button>

        <div style={{ marginTop: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
          Connected: {currentUser}
        </div>
      </div>

      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div style={{ fontWeight: 600 }}>Opportunity Dashboard</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {messages.length} total processed
          </div>
        </div>

        <div className="content-area">
          {/* List View */}
          <div className="message-list">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`message-item ${selectedMsg?.id === msg.id ? 'active' : ''}`}
                onClick={() => setSelectedMsg(msg)}
              >
                <div className="message-header">
                  <span className="sender-name">{msg.sender.split('<')[0]}</span>
                  <span className={`badge priority-${msg.priority?.toLowerCase() || 'low'}`}>
                    {msg.priority || 'low'}
                  </span>
                </div>
                <div className="message-subject">{msg.subject}</div>
                <div>
                  <span className="badge category-badge">{msg.category || 'info'}</span>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="empty-state" style={{ padding: '40px' }}>
                <p>No messages yet. Click Sync.</p>
              </div>
            )}
          </div>

          {/* Detail View */}
          <div className="message-detail">
            {selectedMsg ? (
              <>
                <div className="detail-header">
                  <h1 className="detail-subject">{selectedMsg.subject}</h1>
                  <div className="detail-meta">
                    <div>From: <strong>{selectedMsg.sender}</strong></div>
                    <div>Source: {selectedMsg.source}</div>
                  </div>
                </div>

                <div className="ai-summary-card">
                  <h3>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Summary
                  </h3>
                  <p>{selectedMsg.summary || "No summary available."}</p>
                </div>

                {selectedMsg.metadata_json && selectedMsg.metadata_json !== "{}" && selectedMsg.metadata_json !== "null" && (
                  <div className="metadata-grid">
                    {Object.entries(JSON.parse(selectedMsg.metadata_json)).map(([key, val]) => (
                      <div key={key} className="metadata-item">
                        <span className="metadata-key">{key}</span>
                        <span className="metadata-value">{val}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedMsg.action_required && selectedMsg.action_required !== "None" && (
                  <div className="action-highlight">
                    <h4>Action Required</h4>
                    <p>{selectedMsg.action_required}</p>
                  </div>
                )}

                <div className="raw-body">
                  <div style={{ marginBottom: '16px', fontWeight: 600, color: 'var(--text-main)' }}>Original Message</div>
                  {selectedMsg.body}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p>Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
