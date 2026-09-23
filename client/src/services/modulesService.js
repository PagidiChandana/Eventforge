import api from './api';

// SPEAKER APIs
export const getSpeakerProfile = async () => {
  const response = await api.get('/modules/speaker/profile');
  return response.data;
};

export const updateSpeakerProfile = async (id, profileData) => {
  const response = await api.put(`/modules/speaker/profile/${id}`, profileData);
  return response.data;
};

export const getSpeakerSessions = async () => {
  const response = await api.get('/modules/speaker/sessions');
  return response.data;
};

export const getSpeakerFeedback = async () => {
  const response = await api.get('/modules/speaker/feedback');
  return response.data;
};

export const uploadPresentationMaterial = async (materialData) => {
  const formData = new FormData();
  Object.entries(materialData).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') formData.append(key, value);
  });
  const response = await api.post('/modules/speaker/materials', formData, {
    // Clear the API instance's JSON default so the browser can add the multipart boundary.
    headers: { 'Content-Type': undefined },
    timeout: 120000
  });
  return response.data;
};

export const downloadPresentationMaterial = async (fileId) => {
  const response = await api.get(`/modules/materials/files/${fileId}`, { responseType: 'blob' });
  return response.data;
};

export const getMaterialsBySession = async (sessionId) => {
  const response = await api.get(`/modules/sessions/${sessionId}/materials`);
  return response.data;
};

// SPONSOR APIs
export const getSponsorProfile = async () => {
  const response = await api.get('/modules/sponsor/profile');
  return response.data;
};

export const updateSponsorProfile = async (id, profileData) => {
  const response = await api.put(`/modules/sponsor/profile/${id}`, profileData);
  return response.data;
};

export const getDeliverablesBySponsor = async (sponsorId) => {
  const response = await api.get(`/modules/sponsors/${sponsorId}/deliverables`);
  return response.data;
};

export const createDeliverable = async (deliverableData) => {
  const response = await api.post('/modules/sponsors/deliverables', deliverableData);
  return response.data;
};

export const updateDeliverableStatus = async (id, updateData) => {
  const response = await api.put(`/modules/sponsors/deliverables/${id}`, updateData);
  return response.data;
};

export const uploadBrandAsset = async (assetData) => {
  const response = await api.post('/modules/sponsors/assets', assetData);
  return response.data;
};

export const getBrandAssetsBySponsor = async (sponsorId) => {
  const response = await api.get(`/modules/sponsors/${sponsorId}/assets`);
  return response.data;
};

// ORGANIZER SPEAKER MANAGEMENT (assignment-level; never personal profiles)
export const getOrganizerSpeakers = async () => {
  const response = await api.get('/modules/organizer/speakers');
  return response.data;
};

export const createSpeakerForOrganizer = async (speakerData) => {
  const response = await api.post('/modules/organizer/speakers', speakerData);
  return response.data;
};

export const assignSpeakerToSession = async (sessionId, speakerId) => {
  const response = await api.post(`/modules/organizer/sessions/${sessionId}/speakers`, { speakerId });
  return response.data;
};

export const removeSpeakerFromSession = async (sessionId, speakerId) => {
  const response = await api.delete(`/modules/organizer/sessions/${sessionId}/speakers/${speakerId}`);
  return response.data;
};
