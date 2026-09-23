import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { tutorAPI } from '../api';
import { Card, Button, Select, Alert, PageHeader, Spinner, Badge } from '../components/UI';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

export default function AITutor() {
  const { profile, subjects } = useApp();
  const [subjectId, setSubjectId] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (profile?.id && !historyLoaded) loadHistory();
  }, [profile?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const d = await tutorAPI.history(profile.id, subjectId || undefined);
      const history = (d.history || []).map(h => ({
        role: h.role,
        content: h.content,
        time: h.created_at,
      }));
      setMessages(history);
      setHistoryLoaded(true);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleSubjectChange = async (e) => {
    setSubjectId(e.target.value);
    setMessages([]);
    setHistoryLoaded(false);
    // Load history for new subject
    try {
      const d = await tutorAPI.history(profile.id, e.target.value || undefined);
      setMessages((d.history || []).map(h => ({ role: h.role, content: h.content, time: h.created_at })));
      setHistoryLoaded(true);
    } catch {}
  };

  const handleAsk = async () => {
    if (!question.trim()) { setError('Please enter a question.'); return; }
    if (!profile?.id) return;

    const userMsg = { role: 'user', content: question.trim(), time: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setQuestion('');
    setLoading(true);
    setError('');

    try {
      const res = await tutorAPI.ask({
        profile_id: profile.id,
        subject_id: subjectId || undefined,
        question: userMsg.content,
      });
      const assistantMsg = {
        role: 'assistant',
        content: res.answer,
        time: new Date().toISOString(),
        sources: res.sources,
        used_rag: res.used_rag,
      };
      setMessages(m => [...m, assistantMsg]);
    } catch (err) {
      setError(err.message);
      setMessages(m => m.slice(0, -1)); // Remove user message if failed
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear conversation history?')) return;
    try {
      await tutorAPI.clearHistory(profile.id, subjectId || undefined);
      setMessages([]);
      toast.success('Conversation cleared');
    } catch (err) { toast.error(err.message); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  if (!profile) return <Alert type="warning">Please create a profile first.</Alert>;

  return (
    <div>
      <PageHeader
        title="AI Tutor"
        subtitle="Ask questions about your uploaded study material — powered by IBM Granite + RAG"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Select value={subjectId} onChange={handleSubjectChange} style={{ width: 180 }}>
              <option value="">All subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            {messages.length > 0 && <Button variant="secondary" size="sm" onClick={handleClear}>🗑️ Clear</Button>}
          </div>
        }
      />

      {/* RAG info banner */}
      <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: 12, color: '#1d4ed8', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>🔍</span>
        <span>When you have uploaded study material, the tutor retrieves relevant content and answers based on your notes.</span>
      </div>

      {/* Chat */}
      <Card style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {messages.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>Ask me anything!</div>
              <div style={{ fontSize: 13 }}>Try: "What are the key concepts in this chapter?" or "Explain Newton's laws"</div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 16,
            }}>
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? '#3b82f6' : '#f1f5f9',
                color: msg.role === 'user' ? '#fff' : '#1e293b',
                fontSize: 13,
                lineHeight: 1.6,
              }}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : msg.content}
              </div>
              {msg.sources?.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>Sources:</span>
                  {msg.sources.map((s, j) => <Badge key={j} color="gray">{s}</Badge>)}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <Spinner size={18} />
              <span style={{ fontSize: 13, color: '#9ca3af' }}>IBM Granite is thinking...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '12px 16px' }}>
          {error && <Alert type="error" style={{ marginBottom: 8 }}>{error}</Alert>}
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question... (Enter to send, Shift+Enter for new line)"
              rows={2}
              disabled={loading}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 13,
                resize: 'none',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <Button onClick={handleAsk} loading={loading} disabled={!question.trim()} style={{ alignSelf: 'flex-end', padding: '10px 16px' }}>
              ➤
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
