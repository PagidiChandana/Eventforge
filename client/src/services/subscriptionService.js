import api from './api';

export const listPlans = async () => {
  const response = await api.get('/subscriptions/plans');
  return response.data;
};

export const createPlan = async (planData) => {
  const response = await api.post('/subscriptions/plans', planData);
  return response.data;
};

export const updatePlan = async (planId, planData) => {
  const response = await api.put(`/subscriptions/plans/${planId}`, planData);
  return response.data;
};

export const deletePlan = async (planId) => {
  const response = await api.delete(`/subscriptions/plans/${planId}`);
  return response.data;
};

export const listSubscriptions = async () => {
  const response = await api.get('/subscriptions');
  return response.data;
};

export const getMySubscription = async () => {
  const response = await api.get('/subscriptions/mine');
  return response.data;
};

export const subscribe = async (planId) => {
  const response = await api.post('/subscriptions/subscribe', { planId });
  return response.data;
};

export const setSubscriptionStatus = async (subscriptionId, status) => {
  const response = await api.patch(`/subscriptions/${subscriptionId}/status`, { status });
  return response.data;
};
