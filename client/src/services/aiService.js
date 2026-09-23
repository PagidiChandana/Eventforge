import api from './api';

/**
 * AI Service for Client
 */

export const generateEventDescription = async (payload) => {
  const response = await api.post('/ai/event-description', payload);
  return response.data;
};

export const askEventForgeGuide = async (question, history = []) => {
  const response = await api.post('/ai/guide-chat', { question, history });
  return response.data;
};

export const generateSpeakerBio = async (payload) => {
  const response = await api.post('/ai/speaker-bio', payload);
  return response.data;
};

export const generateAnnouncement = async (payload) => {
  const response = await api.post('/ai/announcement', payload);
  return response.data;
};

export const generateSessionSummary = async (payload) => {
  const response = await api.post('/ai/session-summary', payload);
  return response.data;
};

export const getRecommendedSessions = async (eventId, limit = 5) => {
  const response = await api.get('/ai/recommendations/sessions', {
    params: { eventId, limit }
  });
  return response.data;
};
