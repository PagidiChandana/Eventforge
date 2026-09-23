import api from './api';

// EVENTS
export const getEvents = async (params = {}) => {
  const response = await api.get('/events', { params });
  return response.data;
};

export const getEventById = async (id) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};

export const createEvent = async (eventData) => {
  const response = await api.post('/events', eventData);
  return response.data;
};

export const updateEvent = async (eventId, eventData) => {
  const response = await api.put(`/events/${eventId}`, eventData);
  return response.data;
};

export const deleteEvent = async (eventId) => {
  const response = await api.delete(`/events/${eventId}`);
  return response.data;
};

// VENUES
export const getVenues = async () => {
  const response = await api.get('/events/venues');
  return response.data;
};

export const createVenue = async (venueData) => {
  const response = await api.post('/events/venues', venueData);
  return response.data;
};

export const updateVenue = async (venueId, venueData) => {
  const response = await api.put(`/events/venues/${venueId}`, venueData);
  return response.data;
};

export const deleteVenue = async (venueId) => {
  const response = await api.delete(`/events/venues/${venueId}`);
  return response.data;
};

// SPEAKERS
export const getSpeakers = async () => {
  const response = await api.get('/events/speakers');
  return response.data;
};

export const createSpeaker = async (speakerData) => {
  const response = await api.post('/events/speakers', speakerData);
  return response.data;
};

export const updateSpeaker = async (speakerId, speakerData) => {
  const response = await api.put(`/events/speakers/${speakerId}`, speakerData);
  return response.data;
};

export const deleteSpeaker = async (speakerId) => {
  const response = await api.delete(`/events/speakers/${speakerId}`);
  return response.data;
};

// SESSIONS
export const getSessionsByEvent = async (eventId) => {
  const response = await api.get(`/events/${eventId}/sessions`);
  return response.data;
};

export const createSession = async (eventId, sessionData) => {
  const response = await api.post(`/events/${eventId}/sessions`, sessionData);
  return response.data;
};

export const updateSession = async (eventId, sessionId, sessionData) => {
  const response = await api.put(`/events/${eventId}/sessions/${sessionId}`, sessionData);
  return response.data;
};

export const deleteSession = async (eventId, sessionId) => {
  const response = await api.delete(`/events/${eventId}/sessions/${sessionId}`);
  return response.data;
};

// PACKAGES
export const getPackagesByEvent = async (eventId) => {
  const response = await api.get(`/events/${eventId}/packages`);
  return response.data;
};

export const createPackage = async (eventId, pkgData) => {
  const response = await api.post(`/events/${eventId}/packages`, pkgData);
  return response.data;
};

export const deletePackage = async (eventId, packageId) => {
  const response = await api.delete(`/events/${eventId}/packages/${packageId}`);
  return response.data;
};

// SPONSORS
export const getSponsorsByEvent = async (eventId) => {
  const response = await api.get(`/events/${eventId}/sponsors`);
  return response.data;
};

export const createSponsor = async (eventId, sponsorData) => {
  const response = await api.post(`/events/${eventId}/sponsors`, sponsorData);
  return response.data;
};

export const deleteSponsor = async (eventId, sponsorId) => {
  const response = await api.delete(`/events/${eventId}/sponsors/${sponsorId}`);
  return response.data;
};

// ANNOUNCEMENTS
export const getAnnouncementsByEvent = async (eventId) => {
  const response = await api.get(`/events/${eventId}/announcements`);
  return response.data;
};

export const createAnnouncement = async (eventId, announcementData) => {
  const response = await api.post(`/events/${eventId}/announcements`, announcementData);
  return response.data;
};

export const deleteAnnouncement = async (eventId, announcementId) => {
  const response = await api.delete(`/events/${eventId}/announcements/${announcementId}`);
  return response.data;
};

// ORGANIZATIONS
export const getOrganizations = async () => {
  const response = await api.get('/events/organizations');
  return response.data;
};

export const createOrganization = async (orgData) => {
  const response = await api.post('/events/organizations', orgData);
  return response.data;
};

export const updateOrganization = async (orgId, orgData) => {
  const response = await api.put(`/events/organizations/${orgId}`, orgData);
  return response.data;
};

export const deleteOrganization = async (orgId) => {
  const response = await api.delete(`/events/organizations/${orgId}`);
  return response.data;
};

// DELIVERABLES (Organizer management)
export const getDeliverablesByEvent = async (eventId) => {
  const response = await api.get(`/modules/events/${eventId}/deliverables`);
  return response.data;
};

export const updateDeliverableStatusByOrganizer = async (eventId, deliverableId, updateData) => {
  const response = await api.put(`/modules/events/${eventId}/deliverables/${deliverableId}`, updateData);
  return response.data;
};
