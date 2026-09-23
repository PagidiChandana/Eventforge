import api from './api';

// TICKET CATEGORIES & COUPONS
export const getTicketCategories = async (eventId) => {
  const response = await api.get(`/events/${eventId}/ticket-categories`);
  return response.data;
};

export const createTicketCategory = async (eventId, categoryData) => {
  const response = await api.post(`/events/${eventId}/ticket-categories`, categoryData);
  return response.data;
};

export const updateTicketCategory = async (eventId, categoryId, categoryData) => {
  const response = await api.put(`/events/${eventId}/ticket-categories/${categoryId}`, categoryData);
  return response.data;
};

export const deleteTicketCategory = async (eventId, categoryId) => {
  const response = await api.delete(`/events/${eventId}/ticket-categories/${categoryId}`);
  return response.data;
};

export const getCouponsByEvent = async (eventId) => {
  const response = await api.get(`/events/${eventId}/coupons`);
  return response.data;
};

export const createCoupon = async (eventId, couponData) => {
  const response = await api.post(`/events/${eventId}/coupons`, couponData);
  return response.data;
};

export const validateCoupon = async (eventId, code, ticketPrice) => {
  const response = await api.post(`/events/${eventId}/validate-coupon`, { code, ticketPrice });
  return response.data;
};

// REGISTRATION ACTIONS
export const registerForEvent = async (eventId, registrationData) => {
  const response = await api.post(`/events/${eventId}/register`, registrationData);
  return response.data;
};

export const cancelRegistration = async (registrationId) => {
  const response = await api.put(`/registrations/${registrationId}/cancel`);
  return response.data;
};

export const updateSelectedSessions = async (registrationId, sessionIds) => {
  const response = await api.put(`/registrations/${registrationId}/sessions`, { sessionIds });
  return response.data;
};

// MY REGISTRATIONS & TICKETS
export const getMyRegistrations = async () => {
  const response = await api.get('/my-registrations');
  return response.data;
};

export const getMyTickets = async () => {
  const response = await api.get('/my-tickets');
  return response.data;
};

export const getTicketById = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}`);
  return response.data;
};

// ORGANIZER REGISTRATIONS VIEW
export const getEventRegistrationsForOrganizer = async (eventId) => {
  const response = await api.get(`/events/${eventId}/registrations`);
  return response.data;
};

export const updateRegistrationStatus = async (registrationId, status) => {
  const response = await api.patch(`/registrations/${registrationId}/status`, { status });
  return response.data;
};
