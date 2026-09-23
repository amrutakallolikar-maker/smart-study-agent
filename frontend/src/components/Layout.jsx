import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function GraniteBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  return (
    <div style={{ background: '#fef3c7', borderBottom: '1px solid #fcd34d', fontSize: 13, color: '#92400e' }}>
      <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠️</span>
          <span>
            <strong>IBM Granite not configured.</strong> AI features (summaries, quiz, tutor, flashcards, planner, recommendations) require your IBM watsonx.ai credentials.
          </span>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: '#fcd34d', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#92400e' }}
          >
            {expanded ? 'Hide Setup ▲' : 'How to Fix ▼'}
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: 18, lineHeight: 1, padding: 0 }}
          title="Dismiss"
        >×</button>
      </div>

      {expanded && (
        <div style={{ padding: '0 20px 16px', borderTop: '1px solid #fde68a' }}>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <div style={{ background: '#fffbeb', borderRadius: 8, padding: 12, border: '1px solid #fde68a' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Step 1 — Get IBM Cloud credentials</div>
              <ol style={{ margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
                <li>Sign up at <strong>cloud.ibm.com</strong></li>
                <li>Go to <strong>Manage → Access → API Keys</strong></li>
                <li>Create an API key and copy it</li>
              </ol>
            </div>
            <div style={{ background: '#fffbeb', borderRadius: 8, padding: 12, border: '1px solid #fde68a' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Step 2 — Get watsonx.ai Project ID</div>
              <ol style={{ margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
                <li>Open <strong>watsonx.ai</strong></li>
                <li>Create or open a project</li>
                <li>Go to <strong>Manage → General → Project ID</strong></li>
              </ol>
            </div>
            <div style={{ background: '#fffbeb', borderRadius: 8, padding: 12, border: '1px solid #fde68a' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Step 3 — Add to backend .env</div>
              <pre style={{ margin: 0, fontSize: 11, background: '#1e293b', color: '#86efac', padding: 10, borderRadius: 6, overflowX: 'auto' }}>
{`# smart-study-agent/backend/.env
WATSONX_API_KEY=your_api_key_here
WATSONX_PROJECT_ID=your_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com`}
              </pre>
              <div style={{ marginTop: 8, fontSize: 12 }}>Then restart the backend server.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/profile', label: 'Profile', icon: '👤' },
  { path: '/subjects', label: 'Subjects', icon: '📚' },
  { path: '/resources', label: 'Resource Library', icon: '🗂️' },
  { path: '/upload', label: 'Upload Resource', icon: '⬆️' },
  { path: '/study-material', label: 'Study Material', icon: '📝' },
  { path: '/tutor', label: 'AI Tutor', icon: '🤖' },
  { path: '/planner', label: 'Study Planner', icon: '📅' },
  { path: '/quiz', label: 'Quiz', icon: '🧪' },
  { path: '/flashcards', label: 'Flashcards', icon: '🃏' },
  { path: '/progress', label: 'Progress', icon: '📊' },
  { path: '/recommendations', label: 'Recommendations', icon: '💡' },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { profile, graniteConfigured } = useApp();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 60,
        background: '#1e293b',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        flexShrink: 0,
        overflowX: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 12px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, padding: 0 }}
          >☰</button>
          {sidebarOpen && (
            <span style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', whiteSpace: 'nowrap' }}>
              📖 Smart Study
            </span>
          )}
        </div>

        {/* Profile mini */}
        {sidebarOpen && profile && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Logged in as</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginTop: 2 }}>{profile.name}</div>
            {profile.course && <div style={{ fontSize: 11, color: '#94a3b8' }}>{profile.course}</div>}
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 16px',
                  color: active ? '#60a5fa' : '#94a3b8',
                  background: active ? '#1e3a5f' : 'transparent',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Granite status */}
        {sidebarOpen && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: graniteConfigured ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
              <span style={{ color: graniteConfigured ? '#86efac' : '#fca5a5' }}>
                IBM Granite {graniteConfigured ? 'Connected' : 'Not configured'}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {!graniteConfigured && <GraniteBanner />}
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
