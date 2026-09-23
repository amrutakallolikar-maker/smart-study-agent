import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { quizAPI, resourcesAPI, subjectsAPI } from '../api';
import { Card, Button, Select, Alert, PageHeader, Badge, Spinner, EmptyState, ProgressBar } from '../components/UI';
import toast from 'react-hot-toast';

export default function Quiz() {
  const { profile, subjects } = useApp();
  const [subjectId, setSubjectId] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [resources, setResources] = useState([]);
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Active quiz state
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubjectChange = async (e) => {
    const sid = e.target.value;
    setSubjectId(sid);
    setResourceId('');
    setResources([]);
    if (sid && profile?.id) {
      try {
        const d = await resourcesAPI.list(profile.id, sid);
        setResources(d.resources || []);
      } catch {}
    }
  };

  const handleGenerate = async () => {
    if (!profile?.id) return;
    setGenerating(true);
    setError('');
    setSession(null);
    setQuestions([]);
    setAnswers({});
    setRevealed({});
    setSubmitted(false);
    setResult(null);
    try {
      const res = await quizAPI.generate({
        profile_id: profile.id,
        subject_id: subjectId || undefined,
        resource_id: resourceId || undefined,
        count: parseInt(count),
      });
      setSession(res.sessionId ? { id: res.sessionId } : null);
      const loaded = await quizAPI.getSession(res.sessionId);
      setQuestions(loaded.questions || []);
      setSession(loaded.session);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectAnswer = (questionId, option) => {
    if (submitted) return;
    const letter = option.charAt(0);
    setAnswers(a => ({ ...a, [questionId]: letter }));
  };

  const handleReveal = (questionId) => {
    setRevealed(r => ({ ...r, [questionId]: true }));
  };

  const handleSubmitAll = async () => {
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all ${unanswered.length} remaining question(s).`);
      return;
    }
    setSubmitting(true);
    try {
      // Submit each answer
      await Promise.all(questions.map(q =>
        quizAPI.submitAnswer({ question_id: q.id, student_answer: answers[q.id] })
      ));
      // Complete session
      const res = await quizAPI.complete(session.id);
      setResult(res);
      setSubmitted(true);
      // Load full session with answers and explanations
      const full = await quizAPI.getSession(session.id);
      setQuestions(full.questions || []);
      toast.success(`Quiz complete! Score: ${res.score}/${res.total}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setSession(null);
    setQuestions([]);
    setAnswers({});
    setRevealed({});
    setSubmitted(false);
    setResult(null);
    setError('');
  };

  if (!profile) return <Alert type="warning">Please create a profile first.</Alert>;

  return (
    <div>
      <PageHeader title="Quiz" subtitle="Test your knowledge with AI-generated questions" />

      {/* Config */}
      {!session && (
        <Card title="Configure Quiz" style={{ maxWidth: 500, marginBottom: 24 }}>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Select label="Subject (optional)" value={subjectId} onChange={handleSubjectChange}>
              <option value="">— General / Any subject —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            {resources.length > 0 && (
              <Select label="Based on resource (optional)" value={resourceId} onChange={e => setResourceId(e.target.value)}>
                <option value="">— No specific resource —</option>
                {resources.map(r => <option key={r.id} value={r.id}>{r.original_name}</option>)}
              </Select>
            )}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Number of Questions: {count}</label>
              <input type="range" min={3} max={15} value={count} onChange={e => setCount(e.target.value)} style={{ width: '100%', marginTop: 4 }} />
            </div>
            {error && <Alert type="error">{error}</Alert>}
            <Button onClick={handleGenerate} loading={generating}>
              {generating ? 'Generating Quiz...' : '🧪 Start Quiz'}
            </Button>
          </div>
        </Card>
      )}

      {/* Generating spinner */}
      {generating && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 14 }}>
            <Spinner size={36} />
            <div style={{ color: '#6b7280', fontSize: 13 }}>IBM Granite is generating your quiz questions...</div>
          </div>
        </Card>
      )}

      {/* Result banner */}
      {result && (
        <div style={{
          background: result.percentage >= 70 ? '#f0fdf4' : result.percentage >= 50 ? '#fffbeb' : '#fef2f2',
          border: `1px solid ${result.percentage >= 70 ? '#bbf7d0' : result.percentage >= 50 ? '#fde68a' : '#fecaca'}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
              Score: {result.score} / {result.total}
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              {result.percentage}% • {result.percentage >= 70 ? '🎉 Well done!' : result.percentage >= 50 ? '👍 Good effort!' : '📚 Review and try again!'}
            </div>
            <div style={{ marginTop: 10, width: 240 }}>
              <ProgressBar
                value={result.percentage}
                color={result.percentage >= 70 ? '#22c55e' : result.percentage >= 50 ? '#f59e0b' : '#ef4444'}
              />
            </div>
          </div>
          <Button onClick={resetQuiz} variant="secondary">Take Another Quiz</Button>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 && !generating && (
        <div>
          {/* Progress bar */}
          {!submitted && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                <span>{Object.keys(answers).length} of {questions.length} answered</span>
                <span>{questions.length} questions</span>
              </div>
              <ProgressBar value={Object.keys(answers).length} max={questions.length} />
            </div>
          )}

          {questions.map((q, i) => {
            const selected = answers[q.id];
            const isCorrect = submitted && q.is_correct === 1;
            const isWrong = submitted && q.is_correct === 0;
            const showExplanation = revealed[q.id] || submitted;

            return (
              <Card key={q.id} style={{ marginBottom: 16 }}>
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 12 }}>
                    {i + 1}. {q.question}
                    {submitted && (
                      <span style={{ marginLeft: 8 }}>
                        {isCorrect ? '✅' : '❌'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(q.options || []).map((opt, j) => {
                      const letter = opt.charAt(0);
                      const isSelected = selected === letter;
                      const isCorrectOpt = submitted && q.correct_answer === letter;
                      const isWrongOpt = submitted && isSelected && !isCorrectOpt;

                      let bg = '#f8fafc';
                      let border = '#e5e7eb';
                      let color = '#374151';
                      if (isCorrectOpt) { bg = '#dcfce7'; border = '#86efac'; color = '#15803d'; }
                      else if (isWrongOpt) { bg = '#fee2e2'; border = '#fca5a5'; color = '#b91c1c'; }
                      else if (isSelected && !submitted) { bg = '#eff6ff'; border = '#93c5fd'; color = '#1d4ed8'; }

                      return (
                        <div key={j}
                          onClick={() => handleSelectAnswer(q.id, opt)}
                          style={{
                            padding: '9px 14px',
                            border: `1px solid ${border}`,
                            borderRadius: 8,
                            background: bg,
                            color,
                            fontSize: 13,
                            cursor: submitted ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ fontWeight: 600, width: 20 }}>{letter}.</span>
                          <span>{opt.slice(3)}</span>
                          {isCorrectOpt && <span style={{ marginLeft: 'auto' }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {showExplanation && q.explanation && (
                    <div style={{ marginTop: 12, padding: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#854d0e' }}>
                      💡 {q.explanation}
                    </div>
                  )}
                  {!submitted && selected && !revealed[q.id] && (
                    <button onClick={() => handleReveal(q.id)}
                      style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#3b82f6', textDecoration: 'underline' }}>
                      Show explanation
                    </button>
                  )}
                </div>
              </Card>
            );
          })}

          {!submitted && (
            <div style={{ marginTop: 8 }}>
              <Button onClick={handleSubmitAll} loading={submitting} size="lg">
                Submit Quiz ({Object.keys(answers).length}/{questions.length} answered)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
