import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button, Input, Select, Alert, PageHeader } from '../components/UI';
import toast from 'react-hot-toast';

export default function Profile() {
  const { profile, createProfile, updateProfile } = useApp();
  const [editing, setEditing] = useState(!profile);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || '',
    course: profile?.course || '',
    branch: profile?.branch || '',
    semester: profile?.semester || '',
    study_hours_per_day: profile?.study_hours_per_day || 4,
    exam_date: profile?.exam_date || '',
  });
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      if (profile) {
        await updateProfile(profile.id, form);
        toast.success('Profile updated!');
      } else {
        await createProfile(form);
        toast.success('Profile created!');
      }
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Student Profile"
        subtitle="Manage your personal study information"
        actions={profile && !editing && <Button onClick={() => setEditing(true)}>✏️ Edit Profile</Button>}
      />

      <Card style={{ maxWidth: 600 }}>
        {!editing && profile ? (
          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { label: 'Name', value: profile.name, icon: '👤' },
                { label: 'Course', value: profile.course || '—', icon: '🎓' },
                { label: 'Branch', value: profile.branch || '—', icon: '🌿' },
                { label: 'Semester', value: profile.semester || '—', icon: '📆' },
                { label: 'Study Hours/Day', value: `${profile.study_hours_per_day}h`, icon: '⏰' },
                { label: 'Exam Date', value: profile.exam_date ? new Date(profile.exam_date).toLocaleDateString() : '—', icon: '📅' },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.icon} {f.label}</div>
                  <div style={{ fontSize: 15, color: '#1e293b', fontWeight: 500, marginTop: 2 }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Input label="Full Name" value={form.name} onChange={set('name')} placeholder="e.g. Alice Johnson" required style={{ gridColumn: '1/-1' }} />
              <Input label="Course" value={form.course} onChange={set('course')} placeholder="e.g. B.Tech, BSc" />
              <Input label="Branch/Major" value={form.branch} onChange={set('branch')} placeholder="e.g. Computer Science" />
              <Input label="Semester" value={form.semester} onChange={set('semester')} placeholder="e.g. 5" />
              <Input label="Study Hours per Day" type="number" value={form.study_hours_per_day} onChange={set('study_hours_per_day')} min={0.5} max={16} step={0.5} />
              <Input label="Exam Date" type="date" value={form.exam_date} onChange={set('exam_date')} />
            </div>
            {error && <Alert type="error" style={{ marginBottom: 12 }}>{error}</Alert>}
            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="submit" loading={saving}>{profile ? 'Save Changes' : 'Create Profile'}</Button>
              {profile && <Button variant="secondary" onClick={() => { setEditing(false); setError(''); }}>Cancel</Button>}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
