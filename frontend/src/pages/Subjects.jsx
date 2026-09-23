import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { subjectsAPI } from '../api';
import { Card, Button, Input, Select, Alert, PageHeader, Badge, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6', '#ef4444', '#6366f1'];

export default function Subjects() {
  const { profile, subjects, refreshSubjects } = useApp();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', difficulty: 'medium', priority: 2, color: COLORS[0] });
  const [topicForm, setTopicForm] = useState({ name: '', difficulty: 'medium' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedSubject) {
      subjectsAPI.getTopics(selectedSubject.id)
        .then(d => setTopics(d.topics || []))
        .catch(console.error);
    }
  }, [selectedSubject]);

  if (!profile) return <Alert type="warning">Please create a profile first.</Alert>;

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) { setError('Subject name required'); return; }
    setSaving(true);
    setError('');
    try {
      await subjectsAPI.create({ ...subjectForm, profile_id: profile.id });
      refreshSubjects();
      setShowAddSubject(false);
      setSubjectForm({ name: '', code: '', difficulty: 'medium', priority: 2, color: COLORS[0] });
      toast.success('Subject added!');
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject and all its topics?')) return;
    try {
      await subjectsAPI.delete(id);
      refreshSubjects();
      if (selectedSubject?.id === id) setSelectedSubject(null);
      toast.success('Subject deleted');
    } catch (err) { toast.error(err.message); }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!topicForm.name.trim()) return;
    setSaving(true);
    try {
      await subjectsAPI.addTopic(selectedSubject.id, topicForm);
      const d = await subjectsAPI.getTopics(selectedSubject.id);
      setTopics(d.topics || []);
      setShowAddTopic(false);
      setTopicForm({ name: '', difficulty: 'medium' });
      toast.success('Topic added!');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const toggleTopicComplete = async (topic) => {
    try {
      await subjectsAPI.updateTopic(selectedSubject.id, topic.id, { is_completed: !topic.is_completed });
      const d = await subjectsAPI.getTopics(selectedSubject.id);
      setTopics(d.topics || []);
    } catch (err) { toast.error(err.message); }
  };

  const deleteTopic = async (topic) => {
    try {
      await subjectsAPI.deleteTopic(selectedSubject.id, topic.id);
      const d = await subjectsAPI.getTopics(selectedSubject.id);
      setTopics(d.topics || []);
      toast.success('Topic deleted');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle="Manage your subjects and topics"
        actions={<Button onClick={() => setShowAddSubject(s => !s)}>+ Add Subject</Button>}
      />

      {showAddSubject && (
        <Card title="Add New Subject" style={{ marginBottom: 20, maxWidth: 500 }}>
          <form onSubmit={handleAddSubject} style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Input label="Subject Name *" value={subjectForm.name} onChange={e => setSubjectForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mathematics" style={{ gridColumn: '1/-1' }} />
              <Input label="Subject Code" value={subjectForm.code} onChange={e => setSubjectForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. MATH101" />
              <Select label="Difficulty" value={subjectForm.difficulty} onChange={e => setSubjectForm(f => ({ ...f, difficulty: e.target.value }))}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
              <Select label="Priority" value={subjectForm.priority} onChange={e => setSubjectForm(f => ({ ...f, priority: parseInt(e.target.value) }))}>
                <option value={1}>High</option>
                <option value={2}>Medium</option>
                <option value={3}>Low</option>
              </Select>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Color</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setSubjectForm(f => ({ ...f, color: c }))}
                      style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: subjectForm.color === c ? '3px solid #1e293b' : '2px solid #e5e7eb' }} />
                  ))}
                </div>
              </div>
            </div>
            {error && <Alert type="error" style={{ marginBottom: 10 }}>{error}</Alert>}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" loading={saving}>Add Subject</Button>
              <Button variant="secondary" onClick={() => { setShowAddSubject(false); setError(''); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Subject list */}
        <div>
          <Card title="Your Subjects">
            {subjects.length === 0 ? (
              <EmptyState icon="📚" title="No subjects yet" description="Add your first subject above." />
            ) : (
              <div style={{ padding: '8px 0' }}>
                {subjects.map(s => (
                  <div key={s.id}
                    onClick={() => setSelectedSubject(s)}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      background: selectedSubject?.id === s.id ? '#eff6ff' : 'transparent',
                      borderLeft: `3px solid ${selectedSubject?.id === s.id ? s.color : 'transparent'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{s.name}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteSubject(s.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, padding: 0 }}>🗑️</button>
                    </div>
                    {s.code && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, marginLeft: 18 }}>{s.code}</div>}
                    <div style={{ marginLeft: 18, marginTop: 4, display: 'flex', gap: 6 }}>
                      <Badge color={s.difficulty === 'hard' ? 'red' : s.difficulty === 'easy' ? 'green' : 'yellow'}>{s.difficulty}</Badge>
                      <Badge color="gray">P{s.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Topics */}
        <div>
          {selectedSubject ? (
            <Card title={`Topics — ${selectedSubject.name}`}
              actions={<Button size="sm" onClick={() => setShowAddTopic(t => !t)}>+ Add Topic</Button>}
            >
              {showAddTopic && (
                <form onSubmit={handleAddTopic} style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <Input label="Topic Name" value={topicForm.name} onChange={e => setTopicForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Calculus" style={{ flex: 1 }} />
                  <Select label="Difficulty" value={topicForm.difficulty} onChange={e => setTopicForm(f => ({ ...f, difficulty: e.target.value }))} style={{ width: 120 }}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Select>
                  <Button type="submit" loading={saving} size="sm">Add</Button>
                  <Button variant="secondary" size="sm" onClick={() => setShowAddTopic(false)}>Cancel</Button>
                </form>
              )}
              {topics.length === 0 ? (
                <EmptyState icon="📋" title="No topics yet" description="Add topics to organize your study plan." />
              ) : (
                <div style={{ padding: '8px 0' }}>
                  {topics.map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #f9fafb' }}>
                      <input type="checkbox" checked={!!t.is_completed} onChange={() => toggleTopicComplete(t)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: selectedSubject.color }} />
                      <span style={{ flex: 1, fontSize: 13, color: '#374151', textDecoration: t.is_completed ? 'line-through' : 'none', opacity: t.is_completed ? 0.6 : 1 }}>
                        {t.name}
                      </span>
                      <Badge color={t.difficulty === 'hard' ? 'red' : t.difficulty === 'easy' ? 'green' : 'yellow'}>{t.difficulty}</Badge>
                      <button onClick={() => deleteTopic(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 13, padding: 0 }}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <EmptyState icon="👈" title="Select a subject" description="Click on a subject to view and manage its topics." />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
