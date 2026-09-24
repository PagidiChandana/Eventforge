import api from './api';

// QR CHECK-IN
export const processQRCheckIn = async (qrToken, eventId, ticketId, ticketCode, attendeeId) => {
  const response = await api.post('/operations/check-in', { qrToken, eventId, ticketId, ticketCode, attendeeId });
  return response.data;
};

// SESSION ATTENDANCE
export const markSessionAttendance = async (eventId, sessionId, attendeeId) => {
  const response = await api.post(`/operations/events/${eventId}/session-attendance`, { sessionId, attendeeId });
  return response.data;
};

export const markSessionAttendanceByQR = async (eventId, sessionId, qrToken) => {
  const response = await api.post(`/operations/events/${eventId}/session-attendance`, { sessionId, qrToken });
  return response.data;
};

export const getSessionAttendanceStats = async (eventId, sessionId) => {
  const response = await api.get(`/operations/events/${eventId}/sessions/${sessionId}/attendance`);
  return response.data;
};

// STAFF SHIFTS & ASSIGNMENTS
export const getStaffDirectory = async () => {
  const response = await api.get('/operations/staff-directory');
  return response.data;
};

export const getMyStaffShifts = async () => {
  const response = await api.get('/operations/my-shifts');
  return response.data;
};

export const getStaffAssignments = async (eventId) => {
  const response = await api.get(`/operations/events/${eventId}/staff-assignments`);
  return response.data;
};

export const assignStaff = async (eventId, assignmentData) => {
  const response = await api.post(`/operations/events/${eventId}/staff-assignments`, assignmentData);
  return response.data;
};

export const deleteStaffAssignment = async (eventId, assignmentId) => {
  const response = await api.delete(`/operations/events/${eventId}/staff-assignments/${assignmentId}`);
  return response.data;
};

export const updateStaffAssignment = async (eventId, assignmentId, updateData) => {
  const response = await api.put(`/operations/events/${eventId}/staff-assignments/${assignmentId}`, updateData);
  return response.data;
};

// ORGANIZER OPERATIONS DASHBOARD
export const getEventOperationsOverview = async (eventId) => {
  const response = await api.get(`/operations/events/${eventId}/operations-overview`);
  return response.data;
};

// ATTENDEE SUPPORT LOOKUP
export const searchAttendeeForSupport = async (eventId, queryStr) => {
  const response = await api.get(`/operations/events/${eventId}/support/search`, { params: { query: queryStr } });
  return response.data;
};

// TASKS
export const getMyTasks = async () => {
  const response = await api.get('/tasks/my-tasks');
  return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await api.patch(`/tasks/${taskId}/status`, { status });
  return response.data;
};
