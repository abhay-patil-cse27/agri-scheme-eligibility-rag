import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────
export const login = (email, password) => api.post('/auth/login', { email, password }).then(r => r.data);
export const register = (name, email, password) => api.post('/auth/register', { name, email, password }).then(r => r.data);
export const googleLogin = (token) => api.post('/auth/google', { token }).then(r => r.data);
export const getMe = () => api.get('/auth/me').then(r => r.data);
export const updateDetails = (data) => api.put('/auth/updatedetails', data).then(r => r.data);
export const updatePassword = (data) => api.put('/auth/updatepassword', data).then(r => r.data);
export const forgotPassword = (email) => api.post('/auth/forgotpassword', { email }).then(r => r.data);
export const resetPassword = (token, password) => api.put(`/auth/resetpassword/${token}`, { password }).then(r => r.data);
export const getAllUsers = () => api.get('/auth/users').then((r) => r.data);

// ── Schemes ───────────────────────────────
export const getSchemes = () => api.get('/schemes').then((r) => r.data);
export const getScheme = (id) => api.get(`/schemes/${id}`).then((r) => r.data);
export const deleteScheme = (id) => api.delete(`/schemes/${id}`).then((r) => r.data);

export const uploadScheme = (file, schemeName, description, category) => {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('schemeName', schemeName);
  formData.append('description', description || '');
  formData.append('category', category || 'other');
  return api
    .post('/schemes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    .then((r) => r.data);
};

// ── Profiles ──────────────────────────────
export const getProfiles = () => api.get('/profiles').then((r) => r.data);
export const getProfile = (id) => api.get(`/profiles/${id}`).then((r) => r.data);
export const createProfile = (data) => api.post('/profiles', data).then((r) => r.data);
export const updateProfile = (id, data) => api.put(`/profiles/${id}`, data).then((r) => r.data);
export const deleteProfile = (id) => api.delete(`/profiles/${id}`).then((r) => r.data);

// ── Eligibility ───────────────────────────
export const checkEligibility = (profileId, schemeName, language = 'en') =>
  api.post('/eligibility/check', { profileId, schemeName, language }).then((r) => r.data);

export const checkEligibilityPublic = (profileData, schemeName, language = 'en') =>
  api.post('/eligibility/public-check', { profileData, schemeName, language }).then((r) => r.data);

export const translateResult = (result, language) =>
  api.post('/eligibility/translate-result', { result, language }).then((r) => r.data);

export const getEligibilityHistory = (profileId) =>
  api.get(`/eligibility/history/${profileId}`).then((r) => r.data);

export const deleteEligibilityCheck = (id) =>
  api.delete(`/eligibility/${id}`).then((r) => r.data);

// ── Voice ─────────────────────────────────
export const processVoice = (transcript) =>
  api.post('/voice/process', { transcript }).then((r) => r.data);

export const transcribeAudio = (audioBlob, language = 'en') => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('language', language);
  return api.post('/voice/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }).then((r) => r.data);
};

export const generateSpeech = (text, language = 'hi') =>
  api.post('/voice/tts', { text, language }, { responseType: 'blob' }).then((r) => r.data);

// ── Health ────────────────────────────────
export const getHealth = () => api.get('/health').then((r) => r.data);

// ── Analytics ─────────────────────────────
export const getAnalytics = () => api.get('/analytics').then((r) => r.data);

// ── Graph ─────────────────────────────────
export const getGraphData = () => api.get('/graph/explorer').then((r) => r.data);

export default api;
