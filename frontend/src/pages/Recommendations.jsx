import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { progressAPI } from '../api';
import { Card, Button, PageHeader, Spinner, Alert, Badge } from '../components/UI';
import ReactMarkdown from 'react-markdown';

export default function Recommendations() {
  const { profile } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError('');
    try {
      const d = await progressAPI.getRecommendations(profile.id);
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <Alert type="warning">Please create a profile first.</Alert>;

  return (
    <div>
      <PageHeader
        title="Personalized Recommendations"
        subtitle="AI-powered study advice based on your performance"
        actions={<Button onClick={load} loading={loading}>🔄 {data ? 'Refresh' : 'Get Recommendations'}</Button>}
      />

      {!data && !loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💡</div>
            <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>Get Personalized Recommendations</h3>
            <p style={{ color: '#6b7280', margin: '0 0 20px', fontSize: 14 }}>
              IBM Granite will analyze your quiz scores, study hours, and progress to give you tailored advice.
            </p>
            <Button onClick={load} loading={loading}>Get My Recommendations</Button>
          </div>
        </Card>
      )}

      {loading && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 14 }}>
            <Spinner size={36} />
            <div style={{ color: '#6b7280', fontSize: 13 }}>IBM Granite is analyzing your performance...</div>
          </div>
        </Card>
      )}

      {error && <Alert type="error" style={{ marginBottom: 16 }}>{error}</Alert>}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Weak/strong areas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {data.weakSubjects?.length > 0 && (
              <Card title="🔴 Areas Needing More Attention">
                <div style={{ padding: 16 }}>
                  {data.weakSubjects.map((s, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f9fafb', fontSize: 13 }}>
                      <span style={{ marginRight: 8 }}>⚠️</span>{s}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {data.neglectedSubjects?.length > 0 && (
              <Card title="😴 Neglected Subjects">
                <div style={{ padding: 16 }}>
                  {data.neglectedSubjects.map((s, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f9fafb', fontSize: 13 }}>
                      <span style={{ marginRight: 8 }}>📌</span>{s}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* AI Recommendations */}
          <Card title="📋 Personalized Recommendations from IBM Granite">
            <div style={{ padding: 20, fontSize: 14, lineHeight: 1.8, color: '#374151' }}>
              <ReactMarkdown>{data.recommendations}</ReactMarkdown>
            </div>
          </Card>

          {/* Performance summary */}
          {data.progress && (
            <Card title="📊 Performance Summary">
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                {[
                  { label: 'Overall Avg Score', value: `${data.progress.overallAvgScore}%`, icon: '🎯' },
                  { label: 'Quizzes Completed', value: data.progress.totalQuizzes, icon: '🧪' },
                  { label: 'Study Hours', value: `${data.progress.totalStudyHours}h`, icon: '⏱️' },
                  { label: 'Flashcards', value: data.progress.totalFlashcards, icon: '🃏' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
