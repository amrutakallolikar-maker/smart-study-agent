import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 min for AI calls
});

// Request interceptor
api.interceptors.request.use(config => config, error => Promise.reject(error));

// Response interceptor — normalize errors
api.interceptors.response.use(
  response => response.data,
  error => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Profile
export const profileAPI = {
  get: () => api.get('/profile'),
  create: (data) => api.post('/profile', data),
  update: (id, data) => api.put(`/profile/${id}`, data),
};

// Subjects
export const subjectsAPI = {
  list: (profileId) => api.get('/subjects', { params: { profile_id: profileId } }),
  get: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
  // Topics
  getTopics: (subjectId) => api.get(`/subjects/${subjectId}/topics`),
  addTopic: (subjectId, data) => api.post(`/subjects/${subjectId}/topics`, data),
  updateTopic: (subjectId, topicId, data) => api.put(`/subjects/${subjectId}/topics/${topicId}`, data),
  deleteTopic: (subjectId, topicId) => api.delete(`/subjects/${subjectId}/topics/${topicId}`),
};

// Resources
export const resourcesAPI = {
  list: (profileId, subjectId) => api.get('/resources', { params: { profile_id: profileId, subject_id: subjectId } }),
  get: (id) => api.get(`/resources/${id}`),
  upload: (formData) => api.post('/resources/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/resources/${id}`),
};

// Study Material
export const studyMaterialAPI = {
  list: (profileId, subjectId, type) => api.get('/study-material', { params: { profile_id: profileId, subject_id: subjectId, material_type: type } }),
  generate: (data) => api.post('/study-material/generate', data),
  delete: (id) => api.delete(`/study-material/${id}`),
};

// Tutor
export const tutorAPI = {
  ask: (data) => api.post('/tutor/ask', data),
  history: (profileId, subjectId) => api.get('/tutor/history', { params: { profile_id: profileId, subject_id: subjectId } }),
  clearHistory: (profileId, subjectId) => api.delete('/tutor/history', { params: { profile_id: profileId, subject_id: subjectId } }),
};

// Planner
export const plannerAPI = {
  get: (profileId) => api.get('/planner', { params: { profile_id: profileId } }),
  generate: (profileId) => api.post('/planner/generate', { profile_id: profileId }),
  logSession: (data) => api.post('/planner/sessions', data),
  getSessions: (profileId, subjectId) => api.get('/planner/sessions', { params: { profile_id: profileId, subject_id: subjectId } }),
};

// Quiz
export const quizAPI = {
  generate: (data) => api.post('/quiz/generate', data),
  getSession: (sessionId) => api.get(`/quiz/session/${sessionId}`),
  submitAnswer: (data) => api.post('/quiz/answer', data),
  complete: (sessionId) => api.post(`/quiz/session/${sessionId}/complete`),
  history: (profileId) => api.get('/quiz/history', { params: { profile_id: profileId } }),
};

// Flashcards
export const flashcardsAPI = {
  list: (profileId, subjectId) => api.get('/flashcards', { params: { profile_id: profileId, subject_id: subjectId } }),
  generate: (data) => api.post('/flashcards/generate', data),
  create: (data) => api.post('/flashcards', data),
  update: (id, data) => api.put(`/flashcards/${id}`, data),
  delete: (id) => api.delete(`/flashcards/${id}`),
};

// Progress
export const progressAPI = {
  get: (profileId) => api.get('/progress', { params: { profile_id: profileId } }),
  getRecommendations: (profileId) => api.get('/progress/recommendations', { params: { profile_id: profileId } }),
};

// Health
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
