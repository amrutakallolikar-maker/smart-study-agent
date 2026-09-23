import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { resourcesAPI, subjectsAPI } from '../api';
import { Card, Button, Select, Alert, PageHeader } from '../components/UI';
import toast from 'react-hot-toast';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.txt', '.md'];

export default function UploadResource() {
  const { profile, subjects } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [topics, setTopics] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (f) => {
    if (!f) return;
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type. Allowed: PDF, images, text files.`);
      setFile(null);
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File too large. Maximum size is 20MB.');
      setFile(null);
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  };

  const handleSubjectChange = async (e) => {
    const sid = e.target.value;
    setSubjectId(sid);
    setTopicId('');
    if (sid) {
      try {
        const d = await subjectsAPI.getTopics(sid);
        setTopics(d.topics || []);
      } catch { setTopics([]); }
    } else {
      setTopics([]);
    }
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select a file.'); return; }
    if (!profile?.id) { setError('No profile found. Please create a profile first.'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('profile_id', profile.id);
    if (subjectId) formData.append('subject_id', subjectId);
    if (topicId) formData.append('topic_id', topicId);

    setUploading(true);
    setError('');
    try {
      await resourcesAPI.upload(formData);
      toast.success('File uploaded successfully! Text extraction started.');
      navigate('/resources');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!profile) return <Alert type="warning">Please create a profile first.</Alert>;

  return (
    <div>
      <PageHeader title="Upload Resource" subtitle="Upload notes, PDFs, or images for AI processing" />

      <Card style={{ maxWidth: 560 }}>
        <div style={{ padding: 24 }}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#3b82f6' : file ? '#22c55e' : '#d1d5db'}`,
              borderRadius: 12,
              padding: 40,
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? '#eff6ff' : file ? '#f0fdf4' : '#f8fafc',
              marginBottom: 20,
              transition: 'all 0.2s',
            }}
          >
            <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.md"
              onChange={e => handleFileSelect(e.target.files?.[0])} />
            {file ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 8 }}>
                  {file.type?.includes('pdf') ? '📄' : file.type?.startsWith('image') ? '🖼️' : '📝'}
                </div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{file.name}</div>
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <div style={{ color: '#22c55e', fontSize: 12, marginTop: 6 }}>✅ Ready to upload</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
                <div style={{ fontWeight: 600, color: '#374151', fontSize: 14 }}>Drop a file or click to browse</div>
                <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 6 }}>PDF, Images (JPG/PNG/WebP), Text files • Max 20MB</div>
              </>
            )}
          </div>

          {/* Subject / Topic */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <Select label="Subject (optional)" value={subjectId} onChange={handleSubjectChange}>
              <option value="">— Select subject —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select label="Topic (optional)" value={topicId} onChange={e => setTopicId(e.target.value)} disabled={!subjectId || topics.length === 0}>
              <option value="">— Select topic —</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>

          {error && <Alert type="error" style={{ marginBottom: 14 }}>{error}</Alert>}

          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={handleUpload} loading={uploading} disabled={!file}>
              {uploading ? 'Uploading...' : '⬆️ Upload File'}
            </Button>
            {file && <Button variant="secondary" onClick={() => { setFile(null); setError(''); }}>Clear</Button>}
          </div>

          {uploading && (
            <div style={{ marginTop: 14, padding: 12, background: '#eff6ff', borderRadius: 8, fontSize: 13, color: '#1d4ed8' }}>
              ⏳ Uploading and processing your file. Text extraction (including OCR for images) may take a moment...
            </div>
          )}
        </div>
      </Card>

      {/* Help */}
      <Card title="What can you upload?" style={{ maxWidth: 560, marginTop: 20 }}>
        <div style={{ padding: '8px 16px 16px' }}>
          {[
            { icon: '📄', type: 'PDF Documents', desc: 'Lecture notes, textbooks, research papers' },
            { icon: '🖼️', type: 'Images', desc: 'Photos of textbook pages, handwritten notes (OCR applied)' },
            { icon: '📝', type: 'Text Files', desc: 'Plain text notes, markdown files' },
          ].map(i => (
            <div key={i.type} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 24 }}>{i.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{i.type}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{i.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
