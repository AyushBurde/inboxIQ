import { useState, useEffect } from 'react'
import { loginWithGoogle, getMessages, syncMessages } from './api'
import './index.css'

function App() {
  const [messages, setMessages] = useState([])
  const [selectedMsg, setSelectedMsg] = useState(null)
  const [isLogged, setIsLogged] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check if we just logged in via URL callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('login') === 'success') {
      setIsLogged(true)
      const email = urlParams.get('email')
      setCurrentUser(email || 'user@example.com')
      fetchMessages()
      window.history.replaceState({}, document.title, '/')
    }
  }, [])

  const fetchMessages = async () => {
    const data = await getMessages()
    setMessages(data)
  }

  const handleSync = async () => {
    if (!currentUser) return alert('Please log in first')
    setIsSyncing(true)
    try {
      await syncMessages(currentUser)
      await fetchMessages()
    } catch (e) {
      alert('Error syncing: ' + e.message)
    } finally {
      setIsSyncing(false)
    }
  }

  // Helper counts
  const highCount = messages.filter(m => m.priority?.toLowerCase() === 'high').length
  const categories = [...new Set(messages.map(m => m.category).filter(Boolean))].length
  const userInitial = currentUser ? currentUser.charAt(0).toUpperCase() : '?'

  // ---- Login Screen ----
  if (!isLogged) {
    return (
      <div className="auth-container">
        {/* Animated gradient orbs */}
        <div className="auth-orb orb-1" />
        <div className="auth-orb orb-2" />
        <div className="auth-orb orb-3" />
        <div className="auth-card">
          <div className="auth-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h1>Unified Inbox</h1>
          <p className="auth-subtitle">
            Your AI-powered mail agent that sorts, summarizes,<br />
            and highlights opportunities automatically.
          </p>
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

      {/* Mobile Hamburger */}
      <button
        className="hamburger-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {sidebarOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <span>unified.inbox</span>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </button>
          <button className="nav-item" onClick={handleSync} disabled={isSyncing}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            All Messages
          </button>
        </nav>

        <button
          className={`sync-btn ${isSyncing ? 'syncing' : ''}`}
          onClick={handleSync}
          disabled={isSyncing}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          {isSyncing ? 'Syncing...' : 'Sync New Emails'}
        </button>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{userInitial}</div>
            <div>
              <div className="user-email">
                <span className="status-dot" />
                {currentUser}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="header-title">Opportunity Dashboard</div>
          <div className="header-stats">
            <div className="stat-pill">
              <span className="stat-count">{messages.length}</span> emails
            </div>
            <div className="stat-pill high">
              <span className="stat-count">{highCount}</span> urgent
            </div>
            <div className="stat-pill">
              <span className="stat-count">{categories}</span> categories
            </div>
          </div>
        </div>

        <div className="content-area">
          {/* Message List */}
          <div className="message-list">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`message-item ${selectedMsg?.id === msg.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMsg(msg)
                  setSidebarOpen(false)
                }}
              >
                <div className="message-header">
                  <span className="sender-name">{msg.sender.split('<')[0].trim()}</span>
                  <span className={`badge priority-${msg.priority?.toLowerCase() || 'low'}`}>
                    {msg.priority || 'low'}
                  </span>
                </div>
                <div className="message-subject">{msg.subject}</div>
                <div className="message-badges">
                  <span className="badge category-badge">{msg.category || 'info'}</span>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="empty-state">
                <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <p>No messages yet. Click <strong>Sync New Emails</strong> to get started.</p>
              </div>
            )}
          </div>

          {/* Detail View */}
          <div className="message-detail">
            {selectedMsg ? (
              <>
                <button className="back-btn" onClick={() => setSelectedMsg(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back to list
                </button>

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
                  <p>{selectedMsg.summary || 'No summary available.'}</p>
                </div>

                {selectedMsg.action_required && selectedMsg.action_required !== 'None' && (
                  <div className="action-highlight">
                    <h4>⚡ Action Required</h4>
                    <p>{selectedMsg.action_required}</p>
                  </div>
                )}

                {selectedMsg.metadata_json && selectedMsg.metadata_json !== '{}' && selectedMsg.metadata_json !== 'null' && (
                  <div className="metadata-grid">
                    {Object.entries(JSON.parse(selectedMsg.metadata_json)).map(([key, val]) => (
                      <div key={key} className="metadata-item">
                        <span className="metadata-key">{key}</span>
                        <span className="metadata-value">{val}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="raw-body">
                  <div className="raw-body-title">Original Message</div>
                  {selectedMsg.body}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p>Select a message to view its AI-powered analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
