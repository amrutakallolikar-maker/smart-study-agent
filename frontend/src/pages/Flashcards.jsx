import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { flashcardsAPI, resourcesAPI } from '../api';
import { Card, Button, Select, Alert, PageHeader, Badge, Spinner, EmptyState, Input } from '../components/UI';
import toast from 'react-hot-toast';

export default function Flashcards() {
  const { profile, subjects } = useApp();
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [studyMode, setStudyMode] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Generate form
  const [genSubjectId, setGenSubjectId] = useState('');
  const [genResourceId, setGenResourceId] = useState('');
  const [genCount, setGenCount] = useState(8);
  const [genResources, setGenResources] = useState([]);
  const [genText, setGenText] = useState('');
  const [showGenForm, setShowGenForm] = useState(false);

  // Manual add
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ front: '', back: '', difficulty: 'medium' });

  const load = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const d = await flashcardsAPI.list(profile.id, filterSubject || undefined);
      let cards = d.flashcards || [];
      if (filterDifficulty) cards = cards.filter(c => c.difficulty === filterDifficulty);
      setFlashcards(cards);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [profile?.id, filterSubject, filterDifficulty]);

  const handleSubjectChange = async (e) => {
    const sid = e.target.value;
    setGenSubjectId(sid);
    setGenResourceId('');
    setGenResources([]);
    if (sid && profile?.id) {
      try {
        const d = await resourcesAPI.list(profile.id, sid);
        setGenResources(d.resources || []);
      } catch {}
    }
  };

  const handleGenerate = async () => {
    if (!profile?.id) return;
    setGenerating(true);
    setError('');
    try {
      await flashcardsAPI.generate({
        profile_id: profile.id,
        subject_id: genSubjectId || undefined,
        resource_id: genResourceId || undefined,
        text: genText || undefined,
        count: parseInt(genCount),
      });
      load();
      setShowGenForm(false);
      setGenText('');
      toast.success('Flashcards generated!');
    } catch (err) {
      setError(err.message);
    } finally { setGenerating(false); }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualForm.front.trim() || !manualForm.back.trim()) { toast.error('Front and back are required'); return; }
    try {
      await flashcardsAPI.create({ profile_id: profile.id, ...manualForm });
      load();
      setShowManual(false);
      setManualForm({ front: '', back: '', difficulty: 'medium' });
      toast.success('Flashcard added!');
    } catch (err) { toast.error(err.message); }
  };

  const handleUpdateDifficulty = async (id, difficulty) => {
    try {
      await flashcardsAPI.update(id, { difficulty });
      setFlashcards(fc => fc.map(c => c.id === id ? { ...c, difficulty } : c));
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    try {
      await flashcardsAPI.delete(id);
      setFlashcards(fc => fc.filter(c => c.id !== id));
      toast.success('Deleted');
    } catch (err) { toast.error(err.message); }
  };

  // Study mode
  const studyCards = flashcards;
  const currentCard = studyCards[studyIndex];

  if (!profile) return <Alert type="warning">Please create a profile first.</Alert>;

  if (studyMode && studyCards.length > 0) {
    return (
      <div>
        <PageHeader title="Flashcard Study Mode"
          actions={<Button variant="secondary" onClick={() => { setStudyMode(false); setFlipped(false); }}>← Back to Library</Button>} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{studyIndex + 1} / {studyCards.length}</div>

          {/* Flashcard */}
          <div
            onClick={() => setFlipped(f => !f)}
            style={{
              width: 480,
              minHeight: 240,
              perspective: 1000,
              cursor: 'pointer',
            }}
          >
            <div style={{
              padding: 32,
              background: flipped ? '#eff6ff' : '#fff',
              border: `2px solid ${flipped ? '#3b82f6' : '#e5e7eb'}`,
              borderRadius: 16,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              textAlign: 'center',
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {flipped ? '✅ Answer' : '❓ Question'}
              </div>
              <div style={{ fontSize: 16, color: '#1e293b', lineHeight: 1.6, fontWeight: flipped ? 400 : 600 }}>
                {flipped ? currentCard.back : currentCard.front}
              </div>
              {!flipped && <div style={{ marginTop: 16, fontSize: 12, color: '#9ca3af' }}>Click to reveal answer</div>}
            </div>
          </div>

          {flipped && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#374151', marginRight: 4 }}>Mark as:</span>
              {['easy', 'medium', 'hard'].map(d => (
                <Button key={d} size="sm"
                  variant={currentCard.difficulty === d ? 'primary' : 'secondary'}
                  onClick={() => handleUpdateDifficulty(currentCard.id, d)}
                >
                  {d === 'easy' ? '😊' : d === 'medium' ? '🤔' : '😰'} {d}
                </Button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" disabled={studyIndex === 0}
              onClick={() => { setStudyIndex(i => i - 1); setFlipped(false); }}>
              ← Prev
            </Button>
            <Button variant="secondary" disabled={studyIndex === studyCards.length - 1}
              onClick={() => { setStudyIndex(i => i + 1); setFlipped(false); }}>
              Next →
            </Button>
          </div>

          {studyIndex === studyCards.length - 1 && (
            <div style={{ fontSize: 14, color: '#22c55e', fontWeight: 600 }}>🎉 You've reviewed all flashcards!</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Flashcards" subtitle="Review concepts with AI-generated flashcards"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setShowManual(s => !s)}>+ Manual</Button>
            <Button variant="secondary" onClick={() => setShowGenForm(s => !s)}>✨ Generate</Button>
            {flashcards.length > 0 && (
              <Button onClick={() => { setStudyMode(true); setStudyIndex(0); setFlipped(false); }}>
                📚 Study Mode ({flashcards.length})
              </Button>
            )}
          </div>
        }
      />

      {/* Generate form */}
      {showGenForm && (
        <Card title="Generate Flashcards" style={{ marginBottom: 20, maxWidth: 540 }}>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              <Select label="Subject" value={genSubjectId} onChange={handleSubjectChange}>
                <option value="">— Select subject —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              {genResources.length > 0 && (
                <Select label="Resource" value={genResourceId} onChange={e => setGenResourceId(e.target.value)}>
                  <option value="">— No specific resource —</option>
                  {genResources.map(r => <option key={r.id} value={r.id}>{r.original_name}</option>)}
                </Select>
              )}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Or paste text</label>
                <textarea value={genText} onChange={e => setGenText(e.target.value)} placeholder="Paste study material..." rows={3}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, marginTop: 4, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Count: {genCount}</label>
                <input type="range" min={4} max={20} value={genCount} onChange={e => setGenCount(e.target.value)} style={{ width: '100%', marginTop: 4 }} />
              </div>
            </div>
            {error && <Alert type="error" style={{ marginBottom: 10 }}>{error}</Alert>}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={handleGenerate} loading={generating}>Generate</Button>
              <Button variant="secondary" onClick={() => setShowGenForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Manual form */}
      {showManual && (
        <Card title="Add Flashcard Manually" style={{ marginBottom: 20, maxWidth: 500 }}>
          <form onSubmit={handleManualAdd} style={{ padding: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              <Input label="Front (Question/Term)" value={manualForm.front} onChange={e => setManualForm(f => ({ ...f, front: e.target.value }))} placeholder="Question or term" required />
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Back (Answer/Definition) *</label>
                <textarea value={manualForm.back} onChange={e => setManualForm(f => ({ ...f, back: e.target.value }))} placeholder="Answer or definition" rows={3} required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, marginTop: 4, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <Select label="Difficulty" value={manualForm.difficulty} onChange={e => setManualForm(f => ({ ...f, difficulty: e.target.value }))}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" size="sm">Add Card</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowManual(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <Select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ width: 180 }}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} style={{ width: 140 }}>
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
      ) : flashcards.length === 0 ? (
        <Card>
          <EmptyState icon="🃏" title="No flashcards yet" description="Generate AI flashcards from your study material or add manually."
            action={<Button onClick={() => setShowGenForm(true)}>✨ Generate Flashcards</Button>} />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {flashcards.map(fc => (
            <div key={fc.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: 14, background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', marginBottom: 4 }}>Question</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{fc.front}</div>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', marginBottom: 4 }}>Answer</div>
                <div style={{ fontSize: 13, color: '#374151' }}>{fc.back}</div>
              </div>
              <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['easy', 'medium', 'hard'].map(d => (
                    <button key={d} onClick={() => handleUpdateDifficulty(fc.id, d)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        border: 'none',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontWeight: 600,
                        background: fc.difficulty === d ? (d === 'easy' ? '#dcfce7' : d === 'hard' ? '#fee2e2' : '#fef9c3') : '#f3f4f6',
                        color: fc.difficulty === d ? (d === 'easy' ? '#15803d' : d === 'hard' ? '#b91c1c' : '#854d0e') : '#6b7280',
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <button onClick={() => handleDelete(fc.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, padding: 0 }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
