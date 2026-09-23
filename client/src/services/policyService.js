import api from './api';

export const getPolicy = async () => {
  const response = await api.get('/admin/policy');
  return response.data;
};

export const updatePolicy = async (policyData) => {
  const response = await api.put('/admin/policy', policyData);
  return response.data;
};
