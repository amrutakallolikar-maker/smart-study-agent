import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { resourcesAPI } from '../api';
import { Card, Button, Badge, PageHeader, EmptyState, Select, Spinner, Alert } from '../components/UI';
import toast from 'react-hot-toast';

function fileIcon(type) {
  if (type?.includes('pdf')) return '📄';
  if (type?.startsWith('image')) return '🖼️';
  return '📝';
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function ResourceLibrary() {
  const { profile, subjects } = useApp();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');

  const load = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const d = await resourcesAPI.list(profile.id, filterSubject || undefined);
      setResources(d.resources || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [profile?.id, filterSubject]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await resourcesAPI.delete(id);
      setResources(r => r.filter(x => x.id !== id));
      toast.success('Resource deleted');
    } catch (err) { toast.error(err.message); }
  };

  if (!profile) return <Alert type="warning">Please create a profile first.</Alert>;

  return (
    <div>
      <PageHeader
        title="Resource Library"
        subtitle="All your uploaded study materials"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <Select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ width: 160 }}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Link to="/upload"><Button>⬆️ Upload</Button></Link>
          </div>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
      ) : resources.length === 0 ? (
        <Card>
          <EmptyState icon="🗂️" title="No resources yet" description="Upload your study notes, PDFs, or images to get started."
            action={<Link to="/upload"><Button>Upload First Resource</Button></Link>} />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {resources.map(r => (
            <Card key={r.id}>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ fontSize: 32 }}>{fileIcon(r.file_type)}</div>
                  <button onClick={() => handleDelete(r.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16, padding: 0 }}>🗑️</button>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 4, wordBreak: 'break-word' }}>
                  {r.original_name}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {r.subject_name && <Badge color="blue">{r.subject_name}</Badge>}
                  {r.topic_name && <Badge color="purple">{r.topic_name}</Badge>}
                  <Badge color="gray">{r.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}</Badge>
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  {formatBytes(r.file_size)} • {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
