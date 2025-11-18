const STORAGE_KEY = 'verlof-aanvragen';

export const getLeaveRequests = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveLeaveRequest = (request) => {
  const requests = getLeaveRequests();
  const newRequest = {
    ...request,
    id: Date.now().toString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  requests.push(newRequest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  return newRequest;
};

export const updateLeaveRequest = (id, updates) => {
  const requests = getLeaveRequests();
  const index = requests.findIndex(r => r.id === id);
  if (index !== -1) {
    requests[index] = { ...requests[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    return requests[index];
  }
  return null;
};

export const deleteLeaveRequest = (id) => {
  const requests = getLeaveRequests();
  const filtered = requests.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};

