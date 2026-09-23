import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { studyMaterialAPI, resourcesAPI, subjectsAPI } from '../api';
import { Card, Button, Select, TextArea, Alert, PageHeader, Badge, Spinner, EmptyState } from '../components/UI';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const MATERIAL_TYPES = [
  { value: 'summary', label: '📋 Summary', desc: 'Concise overview of key concepts' },
  { value: 'detailed_notes', label: '📝 Detailed Notes', desc: 'Comprehensive exam-ready notes' },
  { value: 'key_points', label: '🔑 Key Points', desc: 'Important points, definitions, formulas' },
  { value: 'flashcards', label: '🃏 Flashcards', desc: 'Q&A cards for active recall' },
  { value: 'mcqs', label: '🧪 MCQs', desc: 'Multiple choice questions' },
  { value: 'short_answers', label: '✍️ Short Answer Q&A', desc: 'Short questions with model answers' },
  { value: 'important_questions', label: '⭐ Important Questions', desc: 'Exam-focused question bank' },
];

export default function StudyMaterial() {
  const { profile, subjects } = useApp();
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [topics, setTopics] = useState([]);
  const [resourceId, setResourceId] = useState('');
  const [resources, setResources] = useState([]);
  const [materialType, setMaterialType] = useState('summary');
  const [customText, setCustomText] = useState('');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [savedMaterials, setSavedMaterials] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  useEffect(() => {
    if (profile?.id) loadSavedMaterials();
  }, [profile?.id, subjectId]);

  const loadSavedMaterials = async () => {
    if (!profile?.id) return;
    setLoadingSaved(true);
    try {
      const d = await studyMaterialAPI.list(profile.id, subjectId || undefined);
      setSavedMaterials(d.materials || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleSubjectChange = async (e) => {
    const sid = e.target.value;
    setSubjectId(sid);
    setTopicId('');
    setResourceId('');
    setTopics([]);
    setResources([]);
    if (sid) {
      try {
        const [topicData, resData] = await Promise.all([
          subjectsAPI.getTopics(sid),
          resourcesAPI.list(profile.id, sid),
        ]);
        setTopics(topicData.topics || []);
        setResources(resData.resources || []);
      } catch (err) { console.error(err.message); }
    }
  };

  const handleGenerate = async () => {
    if (!profile?.id) return;
    if (!subjectId && !customText.trim() && !resourceId) {
      setError('Please select a subject, resource, or paste some text.');
      return;
    }
    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const res = await studyMaterialAPI.generate({
        profile_id: profile.id,
        subject_id: subjectId || undefined,
        topic_id: topicId || undefined,
        resource_id: resourceId || undefined,
        material_type: materialType,
        text: customText || undefined,
        count: parseInt(count),
      });
      setResult(res);
      loadSavedMaterials();
      toast.success('Material generated!');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const renderContent = (content, type) => {
    if (['flashcards', 'mcqs', 'short_answers'].includes(type)) {
      let parsed;
      try {
        parsed = typeof content === 'string' ? JSON.parse(content) : content;
      } catch { return <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{content}</pre>; }

      if (type === 'flashcards' && Array.isArray(parsed)) {
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {parsed.map((fc, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: 12, background: '#eff6ff', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #dbeafe' }}>
                  Q: {fc.front}
                </div>
                <div style={{ padding: 12, fontSize: 13, color: '#374151' }}>A: {fc.back}</div>
                <div style={{ padding: '4px 12px', background: '#f8fafc' }}>
                  <Badge color={fc.difficulty === 'hard' ? 'red' : fc.difficulty === 'easy' ? 'green' : 'yellow'}>{fc.difficulty}</Badge>
                </div>
              </div>
            ))}
          </div>
        );
      }

      if (type === 'mcqs' && Array.isArray(parsed)) {
        return (
          <div>
            {parsed.map((q, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#1e293b' }}>{i + 1}. {q.question}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                  {(q.options || []).map((opt, j) => (
                    <div key={j} style={{ fontSize: 13, padding: '4px 10px', borderRadius: 6, background: opt.startsWith(q.correct_answer) ? '#dcfce7' : '#f8fafc', color: opt.startsWith(q.correct_answer) ? '#15803d' : '#374151' }}>
                      {opt}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>💡 {q.explanation}</div>
              </div>
            ))}
          </div>
        );
      }

      if (type === 'short_answers' && Array.isArray(parsed)) {
        return (
          <div>
            {parsed.map((q, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 6 }}>Q{i + 1}. {q.question} <Badge color="blue">{q.marks} marks</Badge></div>
                <div style={{ fontSize: 13, color: '#374151', paddingLeft: 12, borderLeft: '3px solid #3b82f6' }}>{q.answer}</div>
              </div>
            ))}
          </div>
        );
      }
    }
    // Default: markdown render
    return (
      <div style={{ fontSize: 14, lineHeight: 1.7, color: '#374151' }}>
        <ReactMarkdown>{typeof content === 'string' ? content : JSON.stringify(content, null, 2)}</ReactMarkdown>
      </div>
    );
  };

  if (!profile) return <Alert type="warning">Please create a profile first.</Alert>;

  return (
    <div>
      <PageHeader title="AI Study Material Generator" subtitle="Generate summaries, notes, flashcards, and more using IBM Granite" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Generator Form */}
        <Card title="Generate Material">
          <div style={{ padding: 16 }}>
            {/* Material type selector */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Material Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {MATERIAL_TYPES.map(t => (
                  <div key={t.value} onClick={() => setMaterialType(t.value)}
                    style={{
                      padding: '8px 10px',
                      border: `1px solid ${materialType === t.value ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: materialType === t.value ? '#eff6ff' : '#fff',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: materialType === t.value ? '#1d4ed8' : '#374151' }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject/Resource Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              <Select label="Subject (optional)" value={subjectId} onChange={handleSubjectChange}>
                <option value="">— Select subject —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              {topics.length > 0 && (
                <Select label="Topic (optional)" value={topicId} onChange={e => setTopicId(e.target.value)}>
                  <option value="">— All topics —</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              )}
              {resources.length > 0 && (
                <Select label="Resource (optional)" value={resourceId} onChange={e => setResourceId(e.target.value)}>
                  <option value="">— No specific resource —</option>
                  {resources.map(r => <option key={r.id} value={r.id}>{r.original_name}</option>)}
                </Select>
              )}
            </div>

            <TextArea
              label="Or paste text directly"
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              placeholder="Paste your study notes, chapter text, etc."
              rows={4}
              style={{ marginBottom: 12 }}
            />

            {['flashcards', 'mcqs', 'short_answers'].includes(materialType) && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Count: {count}</label>
                <input type="range" min={3} max={15} value={count} onChange={e => setCount(e.target.value)}
                  style={{ width: '100%', marginTop: 4 }} />
              </div>
            )}

            {error && <Alert type="error" style={{ marginBottom: 12 }}>{error}</Alert>}

            <Button onClick={handleGenerate} loading={generating} style={{ width: '100%' }}>
              {generating ? 'Generating with IBM Granite...' : '✨ Generate Material'}
            </Button>
          </div>
        </Card>

        {/* Result panel */}
        <Card title={result ? result.title : 'Generated Content'}>
          {generating ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 14 }}>
              <Spinner size={36} />
              <div style={{ color: '#6b7280', fontSize: 13 }}>IBM Granite is generating your study material...</div>
            </div>
          ) : result ? (
            <div style={{ padding: 16, maxHeight: 500, overflowY: 'auto' }}>
              {renderContent(result.content, result.material_type)}
            </div>
          ) : (
            <EmptyState icon="✨" title="Ready to generate" description="Fill in the options on the left and click Generate Material." />
          )}
        </Card>
      </div>

      {/* Saved materials */}
      <Card title="Saved Materials" actions={
        <Button size="sm" variant="ghost" onClick={loadSavedMaterials}>↻ Refresh</Button>
      }>
        {loadingSaved ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner /></div>
        ) : savedMaterials.length === 0 ? (
          <EmptyState icon="📋" title="No saved materials" description="Generated materials are automatically saved here." />
        ) : (
          <div style={{ padding: '8px 0' }}>
            {savedMaterials.map(m => (
              <div key={m.id} style={{ padding: '10px 16px', borderBottom: '1px solid #f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{m.title}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <Badge color="blue">{MATERIAL_TYPES.find(t => t.value === m.material_type)?.label || m.material_type}</Badge>
                    {m.subject_name && <Badge color="purple">{m.subject_name}</Badge>}
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button onClick={async () => {
                  const content = m.content;
                  setResult({ content, title: m.title, material_type: m.material_type });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', padding: '4px 10px', fontSize: 12, color: '#374151' }}>
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
