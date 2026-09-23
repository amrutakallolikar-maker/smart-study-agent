import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { progressAPI } from '../api';
import { Card, StatCard, ProgressBar, Badge, Spinner, Button, Alert } from '../components/UI';

export default function Dashboard() {
  const { profile, subjects, loading } = useApp();
  const [progress, setProgress] = useState(null);
  const [progLoading, setProgLoading] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      setProgLoading(true);
      progressAPI.get(profile.id)
        .then(d => setProgress(d))
        .catch(err => console.error(err))
        .finally(() => setProgLoading(false));
    }
  }, [profile?.id]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={40} />
    </div>
  );

  if (!profile) {
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📖</div>
        <h1 style={{ fontSize: 26, color: '#1e293b', margin: '0 0 12px' }}>Welcome to Smart Study Agent</h1>
        <p style={{ color: '#6b7280', marginBottom: 28, fontSize: 15, lineHeight: 1.6 }}>
          Your AI-powered study companion. Create your student profile to get started.
        </p>
        <Link to="/profile">
          <Button size="lg">Create Profile</Button>
        </Link>
      </div>
    );
  }

  const daysUntilExam = profile.exam_date
    ? Math.max(0, Math.ceil((new Date(profile.exam_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
          Welcome back, {profile.name}! 👋
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
          {profile.course && `${profile.course} • `}{profile.branch && `${profile.branch} • `}
          {profile.semester && `Semester ${profile.semester}`}
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard label="Subjects" value={subjects.length} icon="📚" color="#3b82f6" />
        <StatCard label="Total Quizzes" value={progress?.totalQuizzes || 0} icon="🧪" color="#8b5cf6" />
        <StatCard label="Avg Quiz Score" value={`${progress?.overallAvgScore || 0}%`} icon="🎯" color="#f59e0b" />
        <StatCard label="Study Hours" value={progress?.totalStudyHours || 0} icon="⏱️" color="#22c55e" sub="hours logged" />
        <StatCard label="Flashcards" value={progress?.totalFlashcards || 0} icon="🃏" color="#ec4899" />
        {daysUntilExam !== null && (
          <StatCard
            label="Days to Exam"
            value={daysUntilExam}
            icon="📅"
            color={daysUntilExam <= 7 ? '#ef4444' : '#f59e0b'}
            sub={new Date(profile.exam_date).toLocaleDateString()}
          />
        )}
      </div>

      {/* Subject Progress */}
      {progLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
      ) : progress?.subjectProgress?.length > 0 ? (
        <Card title="Subject Progress" style={{ marginBottom: 24 }}>
          <div style={{ padding: 16 }}>
            {progress.subjectProgress.map(sp => (
              <div key={sp.subject.id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: sp.subject.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{sp.subject.name}</span>
                    {sp.avgQuizScore > 0 && (
                      <Badge color={sp.avgQuizScore >= 70 ? 'green' : sp.avgQuizScore >= 50 ? 'yellow' : 'red'}>
                        {sp.avgQuizScore}%
                      </Badge>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>{sp.completedTopics}/{sp.totalTopics} topics</span>
                </div>
                <ProgressBar value={sp.progressPercent} color={sp.subject.color} />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { to: '/upload', icon: '⬆️', label: 'Upload Notes' },
            { to: '/study-material', icon: '📝', label: 'Generate Material' },
            { to: '/quiz', icon: '🧪', label: 'Take Quiz' },
            { to: '/tutor', icon: '🤖', label: 'Ask AI Tutor' },
            { to: '/flashcards', icon: '🃏', label: 'Flashcards' },
            { to: '/planner', icon: '📅', label: 'Study Plan' },
          ].map(a => (
            <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: 14,
                background: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{a.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{a.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Recent Quizzes */}
      {progress?.recentQuizzes?.length > 0 && (
        <Card title="Recent Quiz Results" style={{ marginTop: 24 }}>
          <div style={{ padding: '0 16px 16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Subject', 'Score', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 8px', color: '#6b7280', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {progress.recentQuizzes.slice(0, 5).map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '8px' }}>{q.subject_name || 'General'}</td>
                    <td style={{ padding: '8px' }}>
                      <Badge color={q.percentage >= 70 ? 'green' : q.percentage >= 50 ? 'yellow' : 'red'}>
                        {q.score}/{q.total_questions} ({q.percentage}%)
                      </Badge>
                    </td>
                    <td style={{ padding: '8px', color: '#9ca3af' }}>{new Date(q.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
