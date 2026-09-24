import api from './api';

export const getOrganizerOverview = async () => {
  const response = await api.get('/analytics/organizer/dashboard');
  return response.data;
};

export const getMyAnalytics = async () => {
  const response = await api.get('/analytics/me');
  return response.data;
};

export const getEventAnalytics = async (eventId) => {
  const response = await api.get(`/analytics/events/${eventId}`);
  return response.data;
};

export const submitFeedback = async (eventId, data) => {
  const response = await api.post(`/events/${eventId}/feedback`, data);
  return response.data;
};

export const getEventFeedback = async (eventId) => {
  const response = await api.get(`/events/${eventId}/feedback`);
  return response.data;
};

export const getMyFeedback = async () => {
  const response = await api.get('/feedback/mine');
  return response.data;
};
