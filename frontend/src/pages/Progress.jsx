import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { progressAPI } from '../api';
import { Card, PageHeader, ProgressBar, Badge, Spinner, StatCard, Alert } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6'];

export default function Progress() {
  const { profile } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      setLoading(true);
      progressAPI.get(profile.id)
        .then(d => setData(d))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [profile?.id]);

  if (!profile) return <Alert type="warning">Please create a profile first.</Alert>;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div>;

  if (!data) return null;

  // Chart data
  const quizChartData = data.subjectProgress
    .filter(sp => sp.quizCount > 0)
    .map(sp => ({
      name: sp.subject.name.length > 12 ? sp.subject.name.slice(0, 12) + '…' : sp.subject.name,
      score: sp.avgQuizScore,
      quizzes: sp.quizCount,
    }));

  const progressChartData = data.subjectProgress.map(sp => ({
    name: sp.subject.name.length > 12 ? sp.subject.name.slice(0, 12) + '…' : sp.subject.name,
    progress: sp.progressPercent,
    completed: sp.completedTopics,
    total: sp.totalTopics,
  }));

  const studyHoursData = data.subjectProgress
    .filter(sp => sp.studyHours > 0)
    .map((sp, i) => ({ name: sp.subject.name, value: sp.studyHours, color: CHART_COLORS[i % CHART_COLORS.length] }));

  const recentScores = data.recentQuizzes.slice(0, 10).map((q, i) => ({
    name: `Quiz ${i + 1}`,
    score: q.percentage,
    subject: q.subject_name,
  }));

  return (
    <div>
      <PageHeader title="Progress Dashboard" subtitle="Your study analytics and performance overview" />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard label="Overall Quiz Score" value={`${data.overallAvgScore}%`} icon="🎯" color="#3b82f6" />
        <StatCard label="Quizzes Taken" value={data.totalQuizzes} icon="🧪" color="#8b5cf6" />
        <StatCard label="Study Hours" value={data.totalStudyHours} icon="⏱️" color="#22c55e" sub="hours" />
        <StatCard label="Flashcards" value={data.totalFlashcards} icon="🃏" color="#ec4899" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Subject Progress */}
        <Card title="Topic Completion by Subject">
          <div style={{ padding: '8px 16px 16px' }}>
            {data.subjectProgress.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af', fontSize: 13 }}>No subjects added yet</div>
            ) : (
              data.subjectProgress.map(sp => (
                <div key={sp.subject.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: sp.subject.color, marginRight: 6 }} />
                      {sp.subject.name}
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{sp.completedTopics}/{sp.totalTopics}</span>
                  </div>
                  <ProgressBar value={sp.progressPercent} color={sp.subject.color} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {sp.studyHours > 0 && <span style={{ fontSize: 11, color: '#9ca3af' }}>⏱️ {sp.studyHours}h</span>}
                    {sp.avgQuizScore > 0 && (
                      <Badge color={sp.avgQuizScore >= 70 ? 'green' : sp.avgQuizScore >= 50 ? 'yellow' : 'red'}>
                        Quiz: {sp.avgQuizScore}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quiz Performance Chart */}
        {quizChartData.length > 0 ? (
          <Card title="Quiz Performance by Subject">
            <div style={{ padding: 16, height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quizChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}%`]} />
                  <Bar dataKey="score" name="Avg Score %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : (
          <Card title="Quiz Performance">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: '#9ca3af', fontSize: 13 }}>
              Take quizzes to see performance data
            </div>
          </Card>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Study hours pie */}
        {studyHoursData.length > 0 ? (
          <Card title="Study Hours Distribution">
            <div style={{ padding: 16, height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={studyHoursData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}h`} labelLine={false}>
                    {studyHoursData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}h`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : null}

        {/* Quiz score trend */}
        {recentScores.length > 1 ? (
          <Card title="Quiz Score Trend">
            <div style={{ padding: 16, height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recentScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}%`]} />
                  <Line type="monotone" dataKey="score" name="Score %" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : null}
      </div>

      {/* Recent quizzes table */}
      {data.recentQuizzes.length > 0 && (
        <Card title="Recent Quiz Results">
          <div style={{ padding: '0 16px 16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Subject', 'Score', '%', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 8px', color: '#6b7280', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentQuizzes.map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '8px' }}>{q.subject_name || 'General'}</td>
                    <td style={{ padding: '8px' }}>{q.score}/{q.total_questions}</td>
                    <td style={{ padding: '8px' }}>
                      <Badge color={q.percentage >= 70 ? 'green' : q.percentage >= 50 ? 'yellow' : 'red'}>{q.percentage}%</Badge>
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
