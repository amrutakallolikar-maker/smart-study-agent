import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { plannerAPI } from '../api';
import { Card, Button, Alert, PageHeader, Select, Input, Spinner, EmptyState } from '../components/UI';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

export default function StudyPlanner() {
  const { profile, subjects } = useApp();
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Study session logging
  const [logForm, setLogForm] = useState({ subject_id: '', hours: '', session_date: new Date().toISOString().slice(0, 10), notes: '' });
  const [sessions, setSessions] = useState([]);
  const [loggingSession, setLoggingSession] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadPlan();
      loadSessions();
    }
  }, [profile?.id]);

  const loadPlan = async () => {
    setPlanLoading(true);
    try {
      const d = await plannerAPI.get(profile.id);
      setPlan(d.plan || null);
    } catch (err) { console.error(err.message); }
    finally { setPlanLoading(false); }
  };

  const loadSessions = async () => {
    try {
      const d = await plannerAPI.getSessions(profile.id);
      setSessions(d.sessions || []);
    } catch {}
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const d = await plannerAPI.generate(profile.id);
      setPlan({ plan_content: d.plan, generated_at: new Date().toISOString() });
      toast.success('Study plan generated!');
    } catch (err) {
      setError(err.message);
    } finally { setGenerating(false); }
  };

  const handleLogSession = async (e) => {
    e.preventDefault();
    if (!logForm.hours || parseFloat(logForm.hours) <= 0) { toast.error('Enter valid hours'); return; }
    setLoggingSession(true);
    try {
      await plannerAPI.logSession({ profile_id: profile.id, ...logForm });
      toast.success('Study session logged!');
      setLogForm(f => ({ ...f, hours: '', notes: '' }));
      loadSessions();
    } catch (err) { toast.error(err.message); }
    finally { setLoggingSession(false); }
  };

  if (!profile) return <Alert type="warning">Please create a profile first.</Alert>;

  return (
    <div>
      <PageHeader
        title="Study Planner"
        subtitle="AI-generated personalized study schedule"
        actions={
          <Button onClick={handleGenerate} loading={generating}>
            🔄 {plan ? 'Regenerate Plan' : 'Generate Plan'}
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Study Plan */}
        <div>
          {error && <Alert type="error" style={{ marginBottom: 12 }}>{error}</Alert>}
          {planLoading ? (
            <Card><div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div></Card>
          ) : generating ? (
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 14 }}>
                <Spinner size={36} />
                <div style={{ color: '#6b7280', fontSize: 13 }}>IBM Granite is creating your personalized study plan...</div>
              </div>
            </Card>
          ) : plan ? (
            <Card title="Your Study Plan"
              actions={<span style={{ fontSize: 11, color: '#9ca3af' }}>Generated {new Date(plan.generated_at).toLocaleDateString()}</span>}
            >
              <div style={{ padding: 16, fontSize: 14, lineHeight: 1.7 }}>
                <ReactMarkdown>{plan.plan_content}</ReactMarkdown>
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState icon="📅" title="No study plan yet"
                description="Generate a personalized plan based on your subjects, topics, exam date, and performance."
                action={<Button onClick={handleGenerate} loading={generating}>Generate My Plan</Button>}
              />
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Log session */}
          <Card title="Log Study Session">
            <form onSubmit={handleLogSession} style={{ padding: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Select label="Subject" value={logForm.subject_id} onChange={e => setLogForm(f => ({ ...f, subject_id: e.target.value }))}>
                  <option value="">— Select subject —</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
                <Input label="Hours Studied" type="number" min="0.25" max="24" step="0.25"
                  value={logForm.hours} onChange={e => setLogForm(f => ({ ...f, hours: e.target.value }))} placeholder="e.g. 2.5" required />
                <Input label="Date" type="date" value={logForm.session_date}
                  onChange={e => setLogForm(f => ({ ...f, session_date: e.target.value }))} required />
                <Input label="Notes (optional)" value={logForm.notes}
                  onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} placeholder="What did you study?" />
                <Button type="submit" loading={loggingSession} size="sm">Log Session</Button>
              </div>
            </form>
          </Card>

          {/* Recent sessions */}
          {sessions.length > 0 && (
            <Card title="Recent Sessions">
              <div style={{ padding: '4px 0' }}>
                {sessions.slice(0, 8).map(s => (
                  <div key={s.id} style={{ padding: '8px 14px', borderBottom: '1px solid #f9fafb' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                      {s.subject_name || 'General'} — {s.hours}h
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(s.session_date).toLocaleDateString()}</div>
                    {s.notes && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{s.notes}</div>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
