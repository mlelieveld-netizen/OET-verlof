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
    status: request.status || 'pending', // Use provided status or default to 'pending'
    createdAt: new Date().toISOString(),
    // Generate unique token for admin link
    adminToken: generateAdminToken(),
    // GitHub issue number (if created)
    githubIssueNumber: null,
  };
  requests.push(newRequest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  return newRequest;
};

// Generate unique token for admin approval link
const generateAdminToken = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get leave request by admin token
export const getLeaveRequestByToken = (token) => {
  const requests = getLeaveRequests();
  return requests.find(r => r.adminToken === token) || null;
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

