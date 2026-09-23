import api from './api';

export const listUsers = async (params = {}) => {
  const response = await api.get('/auth/users', { params });
  return response.data;
};

export const setUserStatus = async (userId, isActive) => {
  const response = await api.patch(`/auth/users/${userId}/status`, { isActive });
  return response.data;
};

export const createUserByAdmin = async (userData) => {
  const response = await api.post('/auth/admin/users', userData);
  return response.data;
};
